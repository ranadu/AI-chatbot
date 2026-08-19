import Foundation
import Testing

@testable import Chatbot

@MainActor
@Suite("AppSettings")
struct AppSettingsTests {
    private func makeSettings() -> AppSettings {
        let suite = "com.robanadu.ChatbotTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)
        return AppSettings(defaults: defaults)
    }

    @Test("Defaults to the deployed backend")
    func defaults() {
        let settings = makeSettings()
        #expect(settings.baseURLString == AppSettings.defaultBaseURL)
        #expect(settings.scopedMemoryPerConversation)
        #expect(settings.sendOnReturn)
    }

    @Test("Assumes HTTPS when no scheme is given")
    func addsScheme() {
        let settings = makeSettings()
        settings.baseURLString = "  example.com  "
        #expect(settings.resolvedBaseURL?.absoluteString == "https://example.com")
    }

    @Test("Keeps an explicit http scheme for local development")
    func keepsLocalScheme() {
        let settings = makeSettings()
        settings.baseURLString = "http://localhost:8000"
        #expect(settings.resolvedBaseURL?.absoluteString == "http://localhost:8000")
    }

    @Test("Rejects addresses it can't use", arguments: ["", "   ", "not a url", "https://"])
    func rejectsInvalid(address: String) {
        let settings = makeSettings()
        settings.baseURLString = address
        #expect(settings.resolvedBaseURL == nil)
    }

    @Test("Falls back to the default name when the field is blank")
    func blankUserID() {
        let settings = makeSettings()
        settings.userID = "   "
        #expect(settings.effectiveUserID == AppSettings.defaultUserID)
    }

    @Test("Surfaces a bad address as an error on send, not silence")
    func invalidAddressFailsLoudly() async {
        let settings = makeSettings()
        settings.baseURLString = "not a url"
        let service = settings.makeService()
        await #expect(throws: ChatServiceError.invalidBaseURL("not a url")) {
            try await service.sendMessage("hi", memoryKey: "robert")
        }
    }

    @Test("Persists edits across instances")
    func persistence() {
        let suite = "com.robanadu.ChatbotTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defaults.removePersistentDomain(forName: suite)

        let first = AppSettings(defaults: defaults)
        first.userID = "ada"
        first.sendOnReturn = false

        let second = AppSettings(defaults: defaults)
        #expect(second.userID == "ada")
        #expect(second.sendOnReturn == false)
    }
}
