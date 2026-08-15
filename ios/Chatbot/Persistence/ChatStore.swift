import Foundation
import SwiftData

/// Owns the SwiftData stack and the few write operations that more than one view needs.
enum ChatStore {
    static let schema = Schema([Conversation.self, Message.self])

    /// The on-disk container used by the running app.
    static func makeContainer() -> ModelContainer {
        let configuration = ModelConfiguration("Chatbot", schema: schema)
        do {
            return try ModelContainer(for: schema, configurations: configuration)
        } catch {
            // A corrupt or migration-incompatible store shouldn't brick the app; start clean
            // rather than crashing, since everything here is a cache of a chat transcript.
            assertionFailure("Falling back to a fresh store: \(error)")
            let fresh = ModelConfiguration("Chatbot-Recovered", schema: schema)
            return try! ModelContainer(for: schema, configurations: fresh)
        }
    }

    /// An in-memory container for previews, seeded with a short exchange.
    @MainActor
    static func makePreviewContainer() -> ModelContainer {
        let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try! ModelContainer(for: schema, configurations: configuration)
        let context = container.mainContext

        let conversation = Conversation(title: "Weekend in Lisbon")
        context.insert(conversation)
        conversation.append(Message(role: .assistant, text: Self.greeting, createdAt: .now.addingTimeInterval(-600)))
        conversation.append(Message(role: .user, text: "Plan me two days in Lisbon.", createdAt: .now.addingTimeInterval(-540)))
        conversation.append(Message(
            role: .assistant,
            text: "Sure — here's a compact plan:\n\n**Day 1** Alfama, then the tram 28 loop.\n**Day 2** Belém pastries and the LX Factory.",
            createdAt: .now.addingTimeInterval(-500)
        ))

        let second = Conversation(title: "Swift concurrency questions")
        context.insert(second)
        second.append(Message(role: .assistant, text: Self.greeting))

        return container
    }

    /// The same opening line the web client shows, so the two feel like one product.
    static let greeting = "👋 Hello! How can I help you today?"

    @MainActor
    @discardableResult
    static func createConversation(in context: ModelContext) -> Conversation {
        let conversation = Conversation()
        context.insert(conversation)
        conversation.append(Message(role: .assistant, text: greeting))
        try? context.save()
        return conversation
    }

    @MainActor
    static func delete(_ conversation: Conversation, in context: ModelContext) {
        context.delete(conversation)
        try? context.save()
    }

    /// Removes every message but the greeting, keeping the thread and its backend memory key.
    @MainActor
    static func clearMessages(in conversation: Conversation, context: ModelContext) {
        for message in conversation.messages {
            context.delete(message)
        }
        conversation.messages = []
        conversation.append(Message(role: .assistant, text: greeting))
        try? context.save()
    }
}
