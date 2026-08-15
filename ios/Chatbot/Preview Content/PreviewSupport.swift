import Foundation

/// A canned service so previews (and any future tests) can exercise the chat flow with no network.
struct PreviewChatService: ChatService {
    var delay: Duration = .milliseconds(600)
    var reply = "This is a canned reply for previews. It supports **Markdown**."
    var errorToThrow: ChatServiceError?

    func sendMessage(_ text: String, memoryKey: String) async throws -> String {
        try? await Task.sleep(for: delay)
        if let errorToThrow { throw errorToThrow }
        return reply
    }
}

extension UserDefaults {
    /// An isolated defaults domain so previews never disturb the app's real settings.
    @MainActor
    static let previewDefaults: UserDefaults = {
        let defaults = UserDefaults(suiteName: "com.robanadu.Chatbot.previews") ?? .standard
        defaults.removePersistentDomain(forName: "com.robanadu.Chatbot.previews")
        return defaults
    }()
}
