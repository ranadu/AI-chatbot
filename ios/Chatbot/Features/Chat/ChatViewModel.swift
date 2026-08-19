import Foundation
import Observation
import SwiftData

/// Owns everything about sending a message for one conversation: the draft text, the
/// in-flight request, and how failures are recorded. The view stays declarative.
@MainActor
@Observable
final class ChatViewModel {
    private let conversation: Conversation
    private let modelContext: ModelContext

    /// Replaced when the server address changes in Settings.
    var service: ChatService

    /// Backend memory key for this thread; recomputed when the setting changes.
    var memoryKey: String

    var draft = ""
    private(set) var isAwaitingReply = false

    /// Set once a reply has been outstanding long enough to look broken. The deployed
    /// backend sleeps on Render's free tier and can take most of a minute to wake, so
    /// saying that is better than an indicator that just sits there.
    private(set) var isTakingLonger = false

    private(set) var failure: ChatServiceError?

    // Monotonic counters the view uses as haptic triggers.
    private(set) var sentCount = 0
    private(set) var receivedCount = 0
    private(set) var failureCount = 0

    /// The user message a retry should resend.
    private var retryableMessage: Message?

    /// The delivery in progress. Exposed so tests can await it; `cancel()` is the only
    /// thing the UI needs from it.
    private(set) var inFlight: Task<Void, Never>?

    private var slowHint: Task<Void, Never>?

    init(conversation: Conversation, modelContext: ModelContext, service: ChatService, memoryKey: String) {
        self.conversation = conversation
        self.modelContext = modelContext
        self.service = service
        self.memoryKey = memoryKey
    }

    var messages: [Message] { conversation.orderedMessages }

    var canSend: Bool {
        !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !isAwaitingReply
    }

    var canRetry: Bool { retryableMessage != nil && !isAwaitingReply }

    /// True before anyone has said anything, so the view can offer starting points.
    var isEmpty: Bool {
        !isAwaitingReply && failure == nil && messages.allSatisfy { !$0.isFromUser }
    }

    func send() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isAwaitingReply else { return }
        draft = ""
        send(text: text)
    }

    /// Sends a suggested prompt without routing it through the composer.
    func send(prompt: String) {
        guard !isAwaitingReply else { return }
        send(text: prompt)
    }

    /// Resends the last message that failed, without duplicating it in the transcript.
    func retry() {
        guard let message = retryableMessage, !isAwaitingReply else { return }
        retryableMessage = nil
        message.delivery = .sending
        save()
        start(delivering: message)
    }

    /// Abandons the in-flight reply. The message stays in the transcript, retryable.
    func cancel() {
        inFlight?.cancel()
    }

    /// Dismisses the error banner but keeps the failed message retryable from its bubble.
    func dismissFailure() {
        failure = nil
    }

    private func send(text: String) {
        conversation.adoptTitleIfNeeded(from: text)
        let message = Message(role: .user, text: text, delivery: .sending)
        conversation.append(message)
        sentCount += 1
        save()
        start(delivering: message)
    }

    private func start(delivering message: Message) {
        // Flipped here rather than inside the task body, which doesn't run until the main
        // actor next yields — the composer should show Stop the moment you hit send.
        isAwaitingReply = true
        failure = nil
        beginSlowHint()
        inFlight = Task { await self.deliver(message) }
    }

    private func deliver(_ message: Message) async {
        defer {
            isAwaitingReply = false
            endSlowHint()
            inFlight = nil
        }

        do {
            let reply = try await service.sendMessage(message.text, memoryKey: memoryKey)
            try Task.checkCancellation()
            message.delivery = .sent
            conversation.append(Message(role: .assistant, text: reply))
            receivedCount += 1
            retryableMessage = nil
        } catch is CancellationError {
            // Cancelled deliberately, or the view went away mid-flight. Not an error —
            // leave the message marked so it can be sent again.
            message.delivery = .failed
            retryableMessage = message
        } catch let error as ChatServiceError {
            handle(error, on: message)
        } catch {
            handle(.backend(error.localizedDescription), on: message)
        }

        save()
    }

    private func handle(_ error: ChatServiceError, on message: Message) {
        message.delivery = .failed
        retryableMessage = message
        failure = error
        failureCount += 1
    }

    private func beginSlowHint() {
        isTakingLonger = false
        slowHint = Task {
            try? await Task.sleep(for: .seconds(8))
            guard !Task.isCancelled else { return }
            isTakingLonger = true
        }
    }

    private func endSlowHint() {
        slowHint?.cancel()
        slowHint = nil
        isTakingLonger = false
    }

    private func save() {
        conversation.touch()
        do {
            try modelContext.save()
        } catch {
            assertionFailure("Could not save the conversation: \(error)")
        }
    }
}
