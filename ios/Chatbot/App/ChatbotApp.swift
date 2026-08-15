import SwiftData
import SwiftUI

@main
struct ChatbotApp: App {
    @State private var settings = AppSettings()
    private let container = ChatStore.makeContainer()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(settings)
                .tint(Theme.Palette.brand)
        }
        .modelContainer(container)
        .commands {
            ChatCommands()
        }
    }
}

/// Hardware-keyboard menu items. On iPad these also appear when holding ⌘.
struct ChatCommands: Commands {
    var body: some Commands {
        CommandGroup(replacing: .newItem) {
            Button("New Chat") {
                NotificationCenter.default.post(name: .newConversationRequested, object: nil)
            }
            .keyboardShortcut("n", modifiers: .command)
        }
    }
}

extension Notification.Name {
    /// Bridges the ⌘N menu command into the view hierarchy that owns the selection.
    static let newConversationRequested = Notification.Name("ChatbotNewConversationRequested")
}
