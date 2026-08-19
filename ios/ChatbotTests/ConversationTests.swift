import Foundation
import Testing

@testable import Chatbot

@Suite("Conversation")
struct ConversationTests {
    @Test("Takes its title from the first line of the first message")
    func titleFromFirstLine() {
        let conversation = Conversation()
        conversation.adoptTitleIfNeeded(from: "  Plan my week\nwith details  ")
        #expect(conversation.title == "Plan my week")
    }

    @Test("Truncates a long title")
    func titleTruncation() {
        let conversation = Conversation()
        conversation.adoptTitleIfNeeded(from: String(repeating: "a", count: 80))
        #expect(conversation.title.count == 49)
        #expect(conversation.title.hasSuffix("…"))
    }

    @Test("Never overwrites a title that already exists")
    func titleIsSticky() {
        let conversation = Conversation(title: "Kept")
        conversation.adoptTitleIfNeeded(from: "Something else")
        #expect(conversation.title == "Kept")
    }

    @Test("Falls back to a placeholder for display")
    func displayTitle() {
        #expect(Conversation().displayTitle == Conversation.untitledTitle)
    }

    @Test("Scopes the backend memory key per conversation")
    func scopedMemoryKey() {
        let conversation = Conversation()
        let scoped = conversation.memoryKey(userID: "robert", scopedPerConversation: true)
        #expect(scoped.hasPrefix("robert#"))
        #expect(scoped.count == "robert#".count + 8)
        // Two threads must not share a slice of memory.
        #expect(scoped != Conversation().memoryKey(userID: "robert", scopedPerConversation: true))
    }

    @Test("Falls back to one shared memory when scoping is off")
    func sharedMemoryKey() {
        #expect(Conversation().memoryKey(userID: "robert", scopedPerConversation: false) == "robert")
    }

    @Test("Orders messages by time, whatever order the relationship returns")
    func ordering() {
        let conversation = Conversation()
        let now = Date.now
        conversation.messages = [
            Message(role: .assistant, text: "third", createdAt: now.addingTimeInterval(20)),
            Message(role: .user, text: "first", createdAt: now),
            Message(role: .assistant, text: "second", createdAt: now.addingTimeInterval(10)),
        ]
        #expect(conversation.orderedMessages.map(\.text) == ["first", "second", "third"])
        #expect(conversation.lastMessage?.text == "third")
    }

    @Test("Marks your own last message in the sidebar subtitle")
    func subtitle() {
        let conversation = Conversation()
        #expect(conversation.subtitle == "No messages yet")
        conversation.messages = [Message(role: .user, text: "Two\nlines")]
        #expect(conversation.subtitle == "You: Two lines")
    }
}
