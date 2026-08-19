import SwiftUI

/// Starting points, shown while a conversation is still empty. This is what fills the
/// large blank transcript on iPad, and it gives the first tap somewhere to go.
struct SuggestionsView: View {
    let onPick: (String) -> Void

    struct Suggestion: Identifiable {
        let id = UUID()
        let symbol: String
        let title: String
        let prompt: String
    }

    /// The last one deliberately exercises the backend's memory, which is the thing that
    /// makes this assistant different from a stateless one.
    private static let suggestions = [
        Suggestion(
            symbol: "lightbulb.max",
            title: "Explain a concept",
            prompt: "Explain what a REST API is, in plain language."
        ),
        Suggestion(
            symbol: "sparkles",
            title: "Brainstorm",
            prompt: "Help me brainstorm ideas for a weekend side project."
        ),
        Suggestion(
            symbol: "envelope",
            title: "Draft a message",
            prompt: "Help me draft a short, friendly email asking for a deadline extension."
        ),
        Suggestion(
            symbol: "brain",
            title: "Test its memory",
            prompt: "Remember that my favourite colour is teal, then tell me what it is."
        ),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.m) {
            Text("Try asking")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.Palette.secondaryText)
                .padding(.leading, Theme.Spacing.xs)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: Theme.Spacing.m)], spacing: Theme.Spacing.m) {
                ForEach(Self.suggestions) { suggestion in
                    Button {
                        onPick(suggestion.prompt)
                    } label: {
                        HStack(spacing: Theme.Spacing.m) {
                            Image(systemName: suggestion.symbol)
                                .font(.system(size: 17))
                                .foregroundStyle(Theme.Palette.brand)
                                .frame(width: 24)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(suggestion.title)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Theme.Palette.primaryText)
                                Text(suggestion.prompt)
                                    .font(.caption)
                                    .foregroundStyle(Theme.Palette.secondaryText)
                                    .lineLimit(2)
                                    .multilineTextAlignment(.leading)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(Theme.Spacing.m)
                        .background(Theme.Palette.surface, in: RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                                .stroke(Theme.Palette.separator, lineWidth: Theme.Spacing.hairline)
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(suggestion.title)
                    .accessibilityHint(suggestion.prompt)
                }
            }
        }
        .padding(.top, Theme.Spacing.s)
    }
}

#Preview {
    ScrollView {
        SuggestionsView { _ in }
            .padding()
    }
    .background(Theme.Palette.canvas)
}
