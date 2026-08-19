import SwiftUI

/// The input bar. Grows with the text up to a few lines, then scrolls internally.
/// While a reply is in flight the send button becomes a stop button.
struct ComposerView: View {
    @Binding var text: String
    let isSending: Bool
    let canSend: Bool
    /// When true, Return sends and ⌥Return inserts a newline (the iMessage habit).
    let sendOnReturn: Bool
    let onSend: () -> Void
    let onStop: () -> Void

    @FocusState.Binding var isFocused: Bool

    var body: some View {
        HStack(alignment: .bottom, spacing: Theme.Spacing.s) {
            TextField("Message", text: $text, axis: .vertical)
                .lineLimit(1...Theme.Layout.composerMaxLines)
                .textInputAutocapitalization(.sentences)
                .submitLabel(sendOnReturn ? .send : .return)
                .focused($isFocused)
                .padding(.horizontal, Theme.Spacing.l)
                .padding(.vertical, Theme.Spacing.m - 2)
                .background(Theme.Palette.canvas, in: Capsule(style: .continuous))
                .overlay(Capsule(style: .continuous).stroke(Theme.Palette.separator, lineWidth: Theme.Spacing.hairline))
                .onSubmit {
                    guard sendOnReturn else { return }
                    onSend()
                }

            actionButton
        }
        .padding(.horizontal, Theme.Spacing.l)
        .padding(.vertical, Theme.Spacing.s)
        .background(.bar)
        .overlay(alignment: .top) {
            Divider()
        }
    }

    private var isEnabled: Bool { isSending || canSend }

    private var actionButton: some View {
        Button {
            if isSending { onStop() } else { onSend() }
        } label: {
            ZStack {
                Circle()
                    .fill(isEnabled ? AnyShapeStyle(Theme.Palette.sendGradient) : AnyShapeStyle(Theme.Palette.separator))
                Image(systemName: isSending ? "stop.fill" : "arrow.up")
                    .font(.system(size: isSending ? 14 : 17, weight: .semibold))
                    .foregroundStyle(isEnabled ? Color.white : Theme.Palette.secondaryText)
            }
            .frame(width: 40, height: 40)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        // Hardware keyboards get ⌘Return regardless of the Return-to-send preference.
        .keyboardShortcut(.return, modifiers: .command)
        .accessibilityLabel(isSending ? "Stop generating" : "Send message")
        .animation(.easeInOut(duration: 0.15), value: isEnabled)
        .animation(.easeInOut(duration: 0.15), value: isSending)
    }
}

#Preview {
    @Previewable @State var text = "A draft message"
    @Previewable @FocusState var focused: Bool

    VStack {
        Spacer()
        ComposerView(
            text: $text,
            isSending: false,
            canSend: true,
            sendOnReturn: true,
            onSend: {},
            onStop: {},
            isFocused: $focused
        )
    }
    .background(Theme.Palette.canvas)
}
