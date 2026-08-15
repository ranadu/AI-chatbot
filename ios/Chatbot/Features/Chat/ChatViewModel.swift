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
    private(set) var failure: ChatServiceError?

    /// The user message a retry should resend.
    private var retryableMessage: Message?

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

    func send() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !isAwaitingReply else { return }

        draft = ""
        conversation.adoptTitleIfNeeded(from: text)

        let message = Message(role: .user, text: text, delivery: .sending)
        conversation.append(message)
        save()

        await deliver(message)
    }

    /// Resends the last message that failed, without duplicating it in the transcript.
    func retry() async {
        guard let message = retryableMessage, !isAwaitingReply else { return }
        retryableMessage = nil
        message.delivery = .sending
        save()
        await deliver(message)
    }

    /// Dismisses the error banner but keeps the failed message retryable from its bubble.
    func dismissFailure() {
        failure = nil
    }

    private func deliver(_ message: Message) async {
        isAwaitingReply = true
        failure = nil
        defer { isAwaitingReply = false }

        do {
            let reply = try await service.sendMessage(message.text, memoryKey: memoryKey)
            message.delivery = .sent
            conversation.append(Message(role: .assistant, text: reply))
            retryableMessage = nil
        } catch let error as ChatServiceError {
            handle(error, on: message)
        } catch is CancellationError {
            // The view went away mid-flight; leave the message marked for retry.
            message.delivery = .failed
            retryableMessage = message
        } catch {
            handle(.backend(error.localizedDescription), on: message)
        }

        save()
    }

    private func handle(_ error: ChatServiceError, on message: Message) {
        message.delivery = .failed
        retryableMessage = message
        failure = error
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
