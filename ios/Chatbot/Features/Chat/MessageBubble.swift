import SwiftUI

/// One message. User turns are a filled brand bubble on the trailing edge; assistant turns
/// are a neutral bubble on the leading edge, with the tail corner pointing at its author.
struct MessageBubble: View {
    let message: Message
    let onRetry: () -> Void

    private var isUser: Bool { message.isFromUser }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: Theme.Spacing.xl) }

            VStack(alignment: isUser ? .trailing : .leading, spacing: Theme.Spacing.xs) {
                content
                    .padding(.horizontal, Theme.Spacing.l)
                    .padding(.vertical, Theme.Spacing.m)
                    .background(bubbleStyle, in: bubbleShape)
                    .foregroundStyle(isUser ? AnyShapeStyle(.white) : AnyShapeStyle(Theme.Palette.primaryText))
                    .opacity(message.delivery == .sending ? 0.65 : 1)

                if message.delivery == .failed {
                    Button("Not delivered — Retry", systemImage: "arrow.clockwise", action: onRetry)
                        .font(.caption)
                        .foregroundStyle(Theme.Palette.danger)
                        .buttonStyle(.plain)
                }
            }

            if !isUser { Spacer(minLength: Theme.Spacing.xl) }
        }
        .contextMenu {
            Button("Copy", systemImage: "doc.on.doc") {
                UIPasteboard.general.string = message.text
            }
            ShareLink(item: message.text) {
                Label("Share", systemImage: "square.and.arrow.up")
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(isUser ? "You" : "Assistant"): \(message.text)")
    }

    @ViewBuilder
    private var content: some View {
        if isUser {
            // The person's own text is never Markdown, so render it verbatim.
            Text(message.text)
                .font(.body)
                .textSelection(.enabled)
        } else {
            MarkdownText(raw: message.text)
                .font(.body)
        }
    }

    private var bubbleStyle: AnyShapeStyle {
        isUser ? AnyShapeStyle(Theme.Palette.brand) : AnyShapeStyle(Theme.Palette.assistantBubble)
    }

    /// Three generous corners plus a tighter one on the author's side. Kept slightly
    /// rounded rather than square so it still reads as a bubble at large text sizes.
    private var bubbleShape: UnevenRoundedRectangle {
        let big = Theme.Radius.bubble
        let tail = Theme.Radius.bubbleTail
        return UnevenRoundedRectangle(
            topLeadingRadius: big,
            bottomLeadingRadius: isUser ? big : tail,
            bottomTrailingRadius: isUser ? tail : big,
            topTrailingRadius: big,
            style: .continuous
        )
    }
}

#Preview {
    VStack(spacing: Theme.Spacing.m) {
        MessageBubble(message: Message(role: .assistant, text: "Hello! How can I help you **today**?"), onRetry: {})
        MessageBubble(message: Message(role: .user, text: "Explain NavigationSplitView."), onRetry: {})
        MessageBubble(message: Message(role: .user, text: "This one failed.", delivery: .failed), onRetry: {})
    }
    .padding()
    .background(Theme.Palette.canvas)
}
