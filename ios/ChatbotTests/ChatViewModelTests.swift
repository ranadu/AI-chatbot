import Foundation
import SwiftData
import Testing

@testable import Chatbot

@MainActor
@Suite("ChatViewModel")
struct ChatViewModelTests {
    /// Everything a test needs, including the container.
    ///
    /// The container has to be held for the duration of the test: let it fall out of
    /// scope and SwiftData traps the moment a model property is read.
    private struct Fixture {
        let container: ModelContainer
        let context: ModelContext
        let conversation: Conversation
        let model: ChatViewModel
    }

    private func makeFixture(service: ChatService) throws -> Fixture {
        let container = try ModelContainer(
            for: ChatStore.schema,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        let context = container.mainContext
        let conversation = Conversation()
        context.insert(conversation)
        conversation.append(Message(role: .assistant, text: ChatStore.greeting))

        return Fixture(
            container: container,
            context: context,
            conversation: conversation,
            model: ChatViewModel(
                conversation: conversation,
                modelContext: context,
                service: service,
                memoryKey: "robert#test"
            )
        )
    }

    @Test("A greeting-only thread counts as empty, so suggestions show")
    func emptyThread() throws {
        let fixture = try makeFixture(service: PreviewChatService(delay: .zero))
        #expect(fixture.model.isEmpty)
    }

    @Test("Sending appends the reply, clears the draft and adopts a title")
    func happyPath() async throws {
        let fixture = try makeFixture(service: PreviewChatService(delay: .zero, reply: "Sure thing"))
        let model = fixture.model

        model.draft = "Plan my week"
        model.send()
        await model.inFlight?.value

        #expect(model.draft.isEmpty)
        #expect(fixture.conversation.title == "Plan my week")
        #expect(fixture.conversation.orderedMessages.map(\.text) == [ChatStore.greeting, "Plan my week", "Sure thing"])
        #expect(fixture.conversation.orderedMessages[1].delivery == .sent)
        #expect(model.sentCount == 1)
        #expect(model.receivedCount == 1)
        #expect(model.failureCount == 0)
        #expect(!model.isAwaitingReply)
        #expect(!model.isEmpty)
    }

    @Test("A suggestion sends without going through the composer")
    func suggestion() async throws {
        let fixture = try makeFixture(service: PreviewChatService(delay: .zero, reply: "Teal"))

        fixture.model.send(prompt: "Remember my favourite colour")
        await fixture.model.inFlight?.value

        #expect(fixture.conversation.orderedMessages.count == 3)
        #expect(fixture.model.draft.isEmpty)
    }

    @Test("Whitespace alone is not sendable")
    func blankDraft() throws {
        let fixture = try makeFixture(service: PreviewChatService(delay: .zero))
        fixture.model.draft = "   \n "
        #expect(!fixture.model.canSend)
        fixture.model.send()
        #expect(fixture.conversation.orderedMessages.count == 1)
    }

    @Test("A failure marks the message, records the error and stays retryable")
    func failureIsRecoverable() async throws {
        let fixture = try makeFixture(service: FailingChatService(error: .offline))
        let model = fixture.model

        model.draft = "Hello"
        model.send()
        await model.inFlight?.value

        #expect(fixture.conversation.orderedMessages.last?.delivery == .failed)
        #expect(model.failure == .offline)
        #expect(model.failureCount == 1)
        #expect(model.canRetry)
        // The failed turn is not duplicated in the transcript.
        #expect(fixture.conversation.orderedMessages.count == 2)

        // Retrying against a working server resolves it in place.
        model.service = PreviewChatService(delay: .zero, reply: "Back online")
        model.retry()
        await model.inFlight?.value

        #expect(fixture.conversation.orderedMessages.map(\.text) == [ChatStore.greeting, "Hello", "Back online"])
        #expect(fixture.conversation.orderedMessages[1].delivery == .sent)
        #expect(!model.canRetry)
    }

    @Test("Dismissing the banner keeps the message retryable")
    func dismissKeepsRetry() async throws {
        let fixture = try makeFixture(service: FailingChatService(error: .timedOut))
        fixture.model.draft = "Hello"
        fixture.model.send()
        await fixture.model.inFlight?.value

        fixture.model.dismissFailure()
        #expect(fixture.model.failure == nil)
        #expect(fixture.model.canRetry)
    }

    @Test("Cancelling leaves the message retryable and reports no error")
    func cancellation() async throws {
        let fixture = try makeFixture(service: PreviewChatService(delay: .seconds(30)))
        let model = fixture.model

        model.draft = "Hello"
        model.send()
        #expect(model.isAwaitingReply)

        model.cancel()
        await model.inFlight?.value

        #expect(!model.isAwaitingReply)
        #expect(model.failure == nil, "A deliberate stop is not a failure")
        #expect(model.failureCount == 0)
        #expect(fixture.conversation.orderedMessages.last?.delivery == .failed)
        #expect(model.canRetry)
    }

    @Test("Clearing a conversation leaves just the greeting")
    func clearing() async throws {
        let fixture = try makeFixture(service: PreviewChatService(delay: .zero))
        fixture.model.draft = "Hello"
        fixture.model.send()
        await fixture.model.inFlight?.value
        #expect(fixture.conversation.orderedMessages.count == 3)

        ChatStore.clearMessages(in: fixture.conversation, context: fixture.context)
        #expect(fixture.conversation.orderedMessages.map(\.text) == [ChatStore.greeting])
    }
}
