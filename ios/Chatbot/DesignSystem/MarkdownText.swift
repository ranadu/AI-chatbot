import SwiftUI

/// Renders an assistant reply, honouring the light Markdown the model tends to emit
/// (**bold**, `code`, links, lists) while leaving plain text untouched.
struct MarkdownText: View {
    let raw: String

    var body: some View {
        Text(attributed)
            .textSelection(.enabled)
    }

    private var attributed: AttributedString {
        // `.full` keeps paragraph and list breaks; without it Markdown collapses to one line.
        let options = AttributedString.MarkdownParsingOptions(
            allowsExtendedAttributes: true,
            interpretedSyntax: .full,
            failurePolicy: .returnPartiallyParsedIfPossible
        )
        if let parsed = try? AttributedString(markdown: raw, options: options) {
            return parsed
        }
        return AttributedString(raw)
    }
}

#Preview {
    MarkdownText(raw: "Here's a **plan**:\n\n1. Ship the iPad layout\n2. Use `NavigationSplitView`\n\nSee [the docs](https://developer.apple.com).")
        .padding()
}
