import Foundation
import Observation

/// User-facing configuration, persisted in `UserDefaults` and shared through the environment.
@MainActor
@Observable
final class AppSettings {
    /// Same deployment the web client talks to (`vite_frontend/src/App.tsx`).
    static let defaultBaseURL = "https://ai-chatbot-8g4u.onrender.com"
    static let defaultUserID = "robert"

    private enum Key {
        static let baseURL = "settings.baseURL"
        static let userID = "settings.userID"
        static let scopedMemory = "settings.scopedMemory"
        static let sendOnReturn = "settings.sendOnReturn"
    }

    private let defaults: UserDefaults

    /// Server address, e.g. `https://…onrender.com` or `http://localhost:8000`.
    var baseURLString: String {
        didSet { defaults.set(baseURLString, forKey: Key.baseURL) }
    }

    /// Identifies this person to the backend's memory table.
    var userID: String {
        didSet { defaults.set(userID, forKey: Key.userID) }
    }

    /// When on, each conversation gets its own slice of backend memory.
    var scopedMemoryPerConversation: Bool {
        didSet { defaults.set(scopedMemoryPerConversation, forKey: Key.scopedMemory) }
    }

    /// Hardware-keyboard behaviour: Return sends, or Return inserts a newline.
    var sendOnReturn: Bool {
        didSet { defaults.set(sendOnReturn, forKey: Key.sendOnReturn) }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.baseURLString = defaults.string(forKey: Key.baseURL) ?? Self.defaultBaseURL
        self.userID = defaults.string(forKey: Key.userID) ?? Self.defaultUserID
        self.scopedMemoryPerConversation = defaults.object(forKey: Key.scopedMemory) as? Bool ?? true
        self.sendOnReturn = defaults.object(forKey: Key.sendOnReturn) as? Bool ?? true
    }

    var resolvedBaseURL: URL? {
        let trimmed = baseURLString.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }
        let withScheme = trimmed.contains("://") ? trimmed : "https://\(trimmed)"
        guard let url = URL(string: withScheme), url.host() != nil else { return nil }
        return url
    }

    var effectiveUserID: String {
        let trimmed = userID.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? Self.defaultUserID : trimmed
    }

    /// Built fresh on each use so edits in Settings take effect immediately.
    func makeService() -> ChatService {
        guard let url = resolvedBaseURL else {
            return FailingChatService(error: .invalidBaseURL(baseURLString))
        }
        return ChatAPIClient(baseURL: url)
    }
}

/// Stands in when the configured address can't be parsed, so the error surfaces in the
/// conversation instead of silently doing nothing.
struct FailingChatService: ChatService {
    let error: ChatServiceError
    func sendMessage(_ text: String, memoryKey: String) async throws -> String {
        throw error
    }
}
