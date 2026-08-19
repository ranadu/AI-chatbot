import SwiftData
import SwiftUI

/// The transcript plus the composer: the detail column on iPad, the pushed screen on iPhone.
struct ChatView: View {
    let conversation: Conversation

    @Environment(AppSettings.self) private var settings
    @Environment(\.modelContext) private var modelContext

    @State private var model: ChatViewModel
    @State private var isShowingClearConfirmation = false
    @FocusState private var isComposerFocused: Bool

    /// The model context and settings come from the parent, which already has them, so the
    /// view model can be built up front rather than appearing a frame late.
    init(conversation: Conversation, modelContext: ModelContext, settings: AppSettings) {
        self.conversation = conversation
        _model = State(initialValue: ChatViewModel(
            conversation: conversation,
            modelContext: modelContext,
            service: settings.makeService(),
            memoryKey: conversation.memoryKey(
                userID: settings.effectiveUserID,
                scopedPerConversation: settings.scopedMemoryPerConversation
            )
        ))
    }

    var body: some View {
        VStack(spacing: 0) {
            transcript
            ComposerView(
                text: $model.draft,
                isSending: model.isAwaitingReply,
                canSend: model.canSend,
                sendOnReturn: settings.sendOnReturn,
                onSend: { model.send() },
                onStop: { model.cancel() },
                isFocused: $isComposerFocused
            )
        }
        .background(Theme.Palette.canvas)
        .navigationTitle(conversation.displayTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { toolbarContent }
        .onChange(of: settings.baseURLString) { _, _ in model.service = settings.makeService() }
        .onChange(of: settings.userID) { _, _ in model.memoryKey = currentMemoryKey }
        .onChange(of: settings.scopedMemoryPerConversation) { _, _ in model.memoryKey = currentMemoryKey }
        .sensoryFeedback(.impact(weight: .light), trigger: model.sentCount)
        .sensoryFeedback(.success, trigger: model.receivedCount)
        .sensoryFeedback(.error, trigger: model.failureCount)
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
                    ForEach(transcriptItems) { item in
                        switch item {
                        case .day(let date):
                            DaySeparator(date: date)
                        case .message(let message):
                            MessageBubble(message: message) { model.retry() }
                                .id(message.id)
                                .transition(.opacity)
                        }
                    }

                    if model.isEmpty {
                        SuggestionsView { model.send(prompt: $0) }
                    }

                    if model.isAwaitingReply {
                        VStack(alignment: .leading, spacing: Theme.Spacing.s) {
                            TypingIndicator()
                            if model.isTakingLonger {
                                Text("Still waiting. A free-tier server can take up to a minute to wake up.")
                                    .font(.caption)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                                    .padding(.leading, Theme.Spacing.xs)
                                    .transition(.opacity)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if let failure = model.failure {
                        FailureBanner(error: failure) { model.dismissFailure() }
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
            .animation(.easeInOut(duration: 0.2), value: model.isTakingLonger)
            .onChange(of: conversation.messages.count) { _, _ in scrollToEnd(proxy) }
            .onChange(of: model.isAwaitingReply) { _, _ in scrollToEnd(proxy) }
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

    /// Messages with a date header inserted whenever the day changes.
    private var transcriptItems: [TranscriptItem] {
        var items: [TranscriptItem] = []
        var lastDay: Date?
        let calendar = Calendar.current
        for message in conversation.orderedMessages {
            let day = calendar.startOfDay(for: message.createdAt)
            if day != lastDay {
                items.append(.day(day))
                lastDay = day
            }
            items.append(.message(message))
        }
        return items
    }

    private enum TranscriptItem: Identifiable {
        case day(Date)
        case message(Message)

        var id: String {
            switch self {
            case .day(let date): return "day-\(date.timeIntervalSinceReferenceDate)"
            case .message(let message): return "message-\(message.id)"
            }
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

/// "Today", "Yesterday", or a date — centred between the bubbles it divides.
private struct DaySeparator: View {
    let date: Date

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.doesRelativeDateFormatting = true
        return formatter
    }()

    var body: some View {
        Text(Self.formatter.string(from: date))
            .font(.caption2.weight(.medium))
            .foregroundStyle(Theme.Palette.secondaryText)
            .padding(.horizontal, Theme.Spacing.m)
            .padding(.vertical, Theme.Spacing.xs)
            .background(Theme.Palette.assistantBubble.opacity(0.6), in: Capsule())
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.xs)
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
    let settings = AppSettings(defaults: .previewDefaults)

    NavigationStack {
        ChatView(conversation: conversation, modelContext: container.mainContext, settings: settings)
    }
    .modelContainer(container)
    .environment(settings)
}
