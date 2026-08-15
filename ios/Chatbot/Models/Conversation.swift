import Foundation
import SwiftData

/// A locally stored thread of messages.
///
/// The backend keeps its own short-term memory keyed by the `user` field it receives
/// (see `backend/memory/memory_store.py`). To make several parallel threads behave the
/// way people expect on iOS, each conversation derives its own `memoryKey`, so the
/// server recalls only the turns belonging to that thread.
@Model
final class Conversation {
    private(set) var id: UUID = UUID()
    var title: String = ""
    var createdAt: Date = Date.now
    var updatedAt: Date = Date.now

    @Relationship(deleteRule: .cascade, inverse: \Message.conversation)
    var messages: [Message] = []

    init(title: String = "", createdAt: Date = .now) {
        self.id = UUID()
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = createdAt
    }
}

extension Conversation {
    static let untitledTitle = "New Chat"

    /// Messages in the order they were written; SwiftData relationships are unordered.
    var orderedMessages: [Message] {
        messages.sorted { $0.createdAt < $1.createdAt }
    }

    var lastMessage: Message? { orderedMessages.last }

    var displayTitle: String {
        title.isEmpty ? Self.untitledTitle : title
    }

    var subtitle: String {
        guard let last = lastMessage else { return "No messages yet" }
        let prefix = last.isFromUser ? "You: " : ""
        return prefix + last.text.replacingOccurrences(of: "\n", with: " ")
    }

    /// Scopes the backend's memory to this thread instead of to the account as a whole.
    func memoryKey(userID: String, scopedPerConversation: Bool) -> String {
        guard scopedPerConversation else { return userID }
        return "\(userID)#\(id.uuidString.prefix(8))"
    }

    /// Derives a title from the first thing the person said, the way Messages does.
    func adoptTitleIfNeeded(from text: String) {
        guard title.isEmpty else { return }
        let firstLine = text
            .split(separator: "\n", omittingEmptySubsequences: true)
            .first
            .map(String.init) ?? text
        let trimmed = firstLine.trimmingCharacters(in: .whitespacesAndNewlines)
        title = trimmed.count > 48 ? String(trimmed.prefix(48)) + "…" : trimmed
    }

    func touch() { updatedAt = .now }

    func append(_ message: Message) {
        messages.append(message)
        touch()
    }
}
