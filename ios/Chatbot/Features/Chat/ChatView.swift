import SwiftData
import SwiftUI

/// The transcript plus the composer: the detail column on iPad, the pushed screen on iPhone.
struct ChatView: View {
    let conversation: Conversation

    @Environment(\.modelContext) private var modelContext
    @Environment(AppSettings.self) private var settings

    @State private var model: ChatViewModel?
    @State private var isShowingClearConfirmation = false
    @FocusState private var isComposerFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            transcript
            if let model {
                ComposerView(
                    text: Binding(get: { model.draft }, set: { model.draft = $0 }),
                    isSending: model.isAwaitingReply,
                    canSend: model.canSend,
                    sendOnReturn: settings.sendOnReturn,
                    onSend: { Task { await model.send() } },
                    isFocused: $isComposerFocused
                )
            }
        }
        .background(Theme.Palette.canvas)
        .navigationTitle(conversation.displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbarContent }
        .task {
            // Built here rather than in `init` so the model context and settings are available.
            if model == nil {
                model = ChatViewModel(
                    conversation: conversation,
                    modelContext: modelContext,
                    service: settings.makeService(),
                    memoryKey: currentMemoryKey
                )
            }
        }
        .onChange(of: settings.baseURLString) { _, _ in model?.service = settings.makeService() }
        .onChange(of: settings.userID) { _, _ in model?.memoryKey = currentMemoryKey }
        .onChange(of: settings.scopedMemoryPerConversation) { _, _ in model?.memoryKey = currentMemoryKey }
        .confirmationDialog("Clear this conversation?", isPresented: $isShowingClearConfirmation, titleVisibility: .visible) {
            Button("Clear Messages", role: .destructive) {
                ChatStore.clearMessages(in: conversation, context: modelContext)
            }
        } message: {
            Text("Messages are removed from this device. The assistant's own short-term memory clears as new messages replace it.")
        }
    }

    private var currentMemoryKey: String {
        conversation.memoryKey(
            userID: settings.effectiveUserID,
            scopedPerConversation: settings.scopedMemoryPerConversation
        )
    }

    // MARK: - Transcript

    private var transcript: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: Theme.Spacing.m) {
                    ForEach(conversation.orderedMessages) { message in
                        MessageBubble(message: message) {
                            Task { await model?.retry() }
                        }
                        .id(message.id)
                        .transition(.opacity)
                    }

                    if model?.isAwaitingReply == true {
                        TypingIndicator()
                    }

                    if let failure = model?.failure {
                        FailureBanner(error: failure) { model?.dismissFailure() }
                    }

                    // A stable anchor to scroll to, so the target doesn't depend on which
                    // of the tail views happens to be showing.
                    Color.clear
                        .frame(height: 1)
                        .id(Self.bottomAnchor)
                }
                .padding(.horizontal, Theme.Spacing.l)
                .padding(.vertical, Theme.Spacing.l)
                // Long lines are hard to read across an iPad; centre a comfortable column.
                .frame(maxWidth: Theme.Layout.maxTranscriptWidth)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
            .defaultScrollAnchor(.bottom)
            .onChange(of: conversation.messages.count) { _, _ in scrollToEnd(proxy) }
            .onChange(of: model?.isAwaitingReply) { _, _ in scrollToEnd(proxy) }
            .onChange(of: isComposerFocused) { _, focused in
                if focused { scrollToEnd(proxy) }
            }
        }
    }

    private static let bottomAnchor = "chat.bottom.anchor"

    private func scrollToEnd(_ proxy: ScrollViewProxy) {
        withAnimation(.easeOut(duration: 0.25)) {
            proxy.scrollTo(Self.bottomAnchor, anchor: .bottom)
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu("Options", systemImage: "ellipsis.circle") {
                Button("Copy Transcript", systemImage: "doc.on.doc") {
                    UIPasteboard.general.string = transcriptText
                }
                ShareLink(item: transcriptText) {
                    Label("Share Transcript", systemImage: "square.and.arrow.up")
                }
                Divider()
                Button("Clear Messages", systemImage: "trash", role: .destructive) {
                    isShowingClearConfirmation = true
                }
            }
        }
    }

    private var transcriptText: String {
        conversation.orderedMessages
            .map { "\($0.isFromUser ? "You" : "Assistant"): \($0.text)" }
            .joined(separator: "\n\n")
    }
}

/// Sits at the end of the transcript when a send fails, explaining what went wrong.
private struct FailureBanner: View {
    let error: ChatServiceError
    let onDismiss: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.s) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(Theme.Palette.danger)
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                Text(error.errorDescription ?? "Something went wrong.")
                    .font(.subheadline.weight(.medium))
                if let suggestion = error.recoverySuggestion {
                    Text(suggestion)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.secondaryText)
                }
            }
            Spacer(minLength: Theme.Spacing.s)
            Button("Dismiss", systemImage: "xmark", action: onDismiss)
                .labelStyle(.iconOnly)
                .buttonStyle(.plain)
                .foregroundStyle(Theme.Palette.secondaryText)
        }
        .padding(Theme.Spacing.m)
        .background(Theme.Palette.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                .stroke(Theme.Palette.danger.opacity(0.35), lineWidth: Theme.Spacing.hairline)
        )
    }
}

#Preview {
    let container = ChatStore.makePreviewContainer()
    let conversation = try! container.mainContext.fetch(FetchDescriptor<Conversation>()).first!

    NavigationStack {
        ChatView(conversation: conversation)
    }
    .modelContainer(container)
    .environment(AppSettings(defaults: .previewDefaults))
}
