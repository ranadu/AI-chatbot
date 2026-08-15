import Combine
import SwiftData
import SwiftUI

/// The app's shell.
///
/// A single `NavigationSplitView` serves both idioms: on iPad (and iPhone in landscape on
/// the larger models) it shows the conversation list beside the transcript; on iPhone the
/// system collapses it into a push navigation stack automatically. Because of that there is
/// no `if horizontalSizeClass == .compact` branching to maintain here.
struct RootView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Conversation.updatedAt, order: .reverse) private var conversations: [Conversation]

    @State private var selectedConversationID: UUID?
    @State private var columnVisibility = NavigationSplitViewVisibility.automatic
    @State private var isShowingSettings = false

    private var selectedConversation: Conversation? {
        conversations.first { $0.id == selectedConversationID }
    }

    var body: some View {
        NavigationSplitView(columnVisibility: $columnVisibility) {
            ConversationListView(
                selection: $selectedConversationID,
                onNewConversation: startNewConversation,
                onShowSettings: { isShowingSettings = true }
            )
        } detail: {
            if let conversation = selectedConversation {
                ChatView(conversation: conversation)
                    // A new identity per thread gives each conversation its own view model
                    // and its own scroll position.
                    .id(conversation.id)
            } else {
                EmptyDetailView(onNewConversation: startNewConversation)
            }
        }
        .navigationSplitViewStyle(.balanced)
        .task { restoreOrCreateSelection() }
        .onChange(of: conversations.count) { _, _ in
            // The selected thread may have just been deleted.
            if selectedConversation == nil { selectedConversationID = conversations.first?.id }
        }
        .sheet(isPresented: $isShowingSettings) {
            SettingsView()
        }
        .onNotification(.newConversationRequested) { startNewConversation() }
    }

    private func restoreOrCreateSelection() {
        if conversations.isEmpty {
            selectedConversationID = ChatStore.createConversation(in: modelContext).id
        } else if selectedConversation == nil {
            selectedConversationID = conversations.first?.id
        }
    }

    private func startNewConversation() {
        // Reuse an untouched thread instead of stacking up empty ones.
        if let blank = conversations.first(where: { $0.title.isEmpty && $0.messages.count <= 1 }) {
            selectedConversationID = blank.id
        } else {
            selectedConversationID = ChatStore.createConversation(in: modelContext).id
        }
        columnVisibility = .automatic
    }
}

/// Shown in the detail column on iPad when nothing is selected.
private struct EmptyDetailView: View {
    let onNewConversation: () -> Void

    var body: some View {
        ContentUnavailableView {
            Label("No Conversation", systemImage: "bubble.left.and.bubble.right")
        } description: {
            Text("Pick a conversation from the sidebar, or start a new one.")
        } actions: {
            Button("New Chat", action: onNewConversation)
                .buttonStyle(.borderedProminent)
        }
        .background(Theme.Palette.canvas)
    }
}

extension View {
    /// Small wrapper so notification plumbing doesn't clutter the view body.
    func onNotification(_ name: Notification.Name, perform action: @escaping () -> Void) -> some View {
        onReceive(NotificationCenter.default.publisher(for: name)) { _ in action() }
    }
}

#Preview {
    RootView()
        .modelContainer(ChatStore.makePreviewContainer())
        .environment(AppSettings(defaults: .previewDefaults))
}
