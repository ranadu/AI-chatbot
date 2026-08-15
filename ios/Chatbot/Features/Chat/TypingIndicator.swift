import SwiftUI

/// Three pulsing dots in an assistant-shaped bubble, shown while a reply is in flight.
/// Respects Reduce Motion by falling back to static text.
struct TypingIndicator: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase = 0

    var body: some View {
        HStack {
            Group {
                if reduceMotion {
                    Text("Typing…")
                        .font(.subheadline)
                        .foregroundStyle(Theme.Palette.secondaryText)
                } else {
                    dots
                }
            }
            .padding(.horizontal, Theme.Spacing.l)
            .padding(.vertical, Theme.Spacing.m)
            .background(
                Theme.Palette.assistantBubble,
                in: UnevenRoundedRectangle(
                    topLeadingRadius: Theme.Radius.bubble,
                    bottomLeadingRadius: Theme.Radius.bubbleTail,
                    bottomTrailingRadius: Theme.Radius.bubble,
                    topTrailingRadius: Theme.Radius.bubble,
                    style: .continuous
                )
            )
            Spacer(minLength: Theme.Spacing.xl)
        }
        .accessibilityLabel("The assistant is typing")
    }

    private var dots: some View {
        HStack(spacing: Theme.Spacing.xs + 2) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Theme.Palette.secondaryText)
                    .frame(width: 7, height: 7)
                    .opacity(phase == index ? 1 : 0.3)
                    .animation(.easeInOut(duration: 0.25), value: phase)
            }
        }
        .task {
            // A timer rather than a repeating animation, so the loop stops with the view.
            while !Task.isCancelled {
                try? await Task.sleep(for: .milliseconds(320))
                phase = (phase + 1) % 3
            }
        }
    }
}

#Preview {
    TypingIndicator()
        .padding()
        .background(Theme.Palette.canvas)
}
