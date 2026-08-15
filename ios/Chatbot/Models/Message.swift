import Foundation
import SwiftData

/// A single turn in a conversation.
///
/// `role` and `delivery` are persisted as raw strings so the store stays readable
/// and forward-compatible if new cases are added later.
@Model
final class Message {
    enum Role: String, Codable, Sendable {
        case user
        case assistant
    }

    /// Tracks whether a message made it to the backend, so failed sends can be retried.
    enum Delivery: String, Codable, Sendable {
        case sent
        case sending
        case failed
    }

    private(set) var id: UUID = UUID()
    var text: String = ""
    var createdAt: Date = Date.now
    var roleRaw: String = Role.assistant.rawValue
    var deliveryRaw: String = Delivery.sent.rawValue

    var conversation: Conversation?

    var role: Role {
        get { Role(rawValue: roleRaw) ?? .assistant }
        set { roleRaw = newValue.rawValue }
    }

    var delivery: Delivery {
        get { Delivery(rawValue: deliveryRaw) ?? .sent }
        set { deliveryRaw = newValue.rawValue }
    }

    init(role: Role, text: String, delivery: Delivery = .sent, createdAt: Date = .now) {
        self.id = UUID()
        self.text = text
        self.createdAt = createdAt
        self.roleRaw = role.rawValue
        self.deliveryRaw = delivery.rawValue
    }
}

extension Message {
    var isFromUser: Bool { role == .user }
}
