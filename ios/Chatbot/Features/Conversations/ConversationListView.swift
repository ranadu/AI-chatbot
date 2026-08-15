import SwiftData
import SwiftUI

/// Sidebar on iPad, root of the stack on iPhone.
struct ConversationListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Conversation.updatedAt, order: .reverse) private var conversations: [Conversation]

    @Binding var selection: UUID?
    let onNewConversation: () -> Void
    let onShowSettings: () -> Void

    @State private var searchText = ""
    @State private var conversationBeingRenamed: Conversation?
    @State private var draftTitle = ""

    private var filtered: [Conversation] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty else { return conversations }
        return conversations.filter { conversation in
            conversation.displayTitle.lowercased().contains(query)
                || conversation.messages.contains { $0.text.lowercased().contains(query) }
        }
    }

    var body: some View {
        List(selection: $selection) {
            ForEach(filtered) { conversation in
                ConversationRow(conversation: conversation)
                    .tag(conversation.id)
                    .contextMenu {
                        Button("Rename", systemImage: "pencil") { beginRename(conversation) }
                        Button("Delete", systemImage: "trash", role: .destructive) {
                            delete(conversation)
                        }
                    }
                    .swipeActions(edge: .trailing) {
                        Button("Delete", systemImage: "trash", role: .destructive) {
                            delete(conversation)
                        }
                    }
            }
        }
        .listStyle(.sidebar)
        .searchable(text: $searchText, placement: .navigationBarDrawer, prompt: "Search conversations")
        .navigationTitle("Chats")
        .overlay {
            if filtered.isEmpty {
                if searchText.isEmpty {
                    ContentUnavailableView("No Chats", systemImage: "bubble.left", description: Text("Tap + to start one."))
                } else {
                    ContentUnavailableView.search(text: searchText)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("New Chat", systemImage: "square.and.pencil", action: onNewConversation)
                    .keyboardShortcut("n", modifiers: .command)
            }
            ToolbarItem(placement: .topBarLeading) {
                Button("Settings", systemImage: "gearshape", action: onShowSettings)
            }
        }
        .alert("Rename Chat", isPresented: renameBinding) {
            TextField("Title", text: $draftTitle)
            Button("Cancel", role: .cancel) { conversationBeingRenamed = nil }
            Button("Save") { commitRename() }
        }
    }

    private var renameBinding: Binding<Bool> {
        Binding(
            get: { conversationBeingRenamed != nil },
            set: { if !$0 { conversationBeingRenamed = nil } }
        )
    }

    private func beginRename(_ conversation: Conversation) {
        draftTitle = conversation.displayTitle
        conversationBeingRenamed = conversation
    }

    private func commitRename() {
        guard let conversation = conversationBeingRenamed else { return }
        let trimmed = draftTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        conversation.title = trimmed
        try? modelContext.save()
        conversationBeingRenamed = nil
    }

    private func delete(_ conversation: Conversation) {
        if selection == conversation.id { selection = nil }
        ChatStore.delete(conversation, in: modelContext)
    }
}

private struct ConversationRow: View {
    let conversation: Conversation

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            HStack(alignment: .firstTextBaseline) {
                Text(conversation.displayTitle)
                    .font(.headline)
                    .lineLimit(1)
                Spacer(minLength: Theme.Spacing.s)
                Text(conversation.updatedAt, format: .relative(presentation: .numeric, unitsStyle: .narrow))
                    .font(.caption2)
                    .foregroundStyle(Theme.Palette.secondaryText)
            }
            Text(conversation.subtitle)
                .font(.subheadline)
                .foregroundStyle(Theme.Palette.secondaryText)
                .lineLimit(2)
        }
        .padding(.vertical, Theme.Spacing.xs)
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    NavigationStack {
        ConversationListView(selection: .constant(nil), onNewConversation: {}, onShowSettings: {})
    }
    .modelContainer(ChatStore.makePreviewContainer())
}
