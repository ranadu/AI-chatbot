import SwiftUI

/// One place for the app's colours, spacing and radii.
///
/// Colours are defined as dynamic `UIColor`s rather than asset entries so the light/dark
/// pair for each role lives on a single line and stays easy to audit. The palette follows
/// the web client (`vite_frontend/src/App.css`) so the two front ends look related.
enum Theme {
    enum Palette {
        /// Brand blue — also the app's accent colour in the asset catalog.
        static let brand = Color.dynamic(light: 0x2563EB, dark: 0x3B82F6)

        /// Behind the transcript.
        static let canvas = Color.dynamic(light: 0xF7F8FB, dark: 0x0B0C0F)

        /// Cards, composer bar, sidebar rows.
        static let surface = Color.dynamic(light: 0xFFFFFF, dark: 0x17181C)

        /// The assistant's bubble.
        static let assistantBubble = Color.dynamic(light: 0xECEEF3, dark: 0x24262C)

        /// Hairlines and bubble borders.
        static let separator = Color.dynamic(light: 0xE3E6EC, dark: 0x2C2E35)

        static let primaryText = Color.dynamic(light: 0x111827, dark: 0xF2F3F5)
        static let secondaryText = Color.dynamic(light: 0x6B7280, dark: 0x9BA1AC)

        static let danger = Color.dynamic(light: 0xDC2626, dark: 0xF87171)

        /// The gradient on the send button, mirroring the web client's.
        static let sendGradient = LinearGradient(
            colors: [Color.dynamic(light: 0x3B82F6, dark: 0x60A5FA), brand],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    enum Spacing {
        static let hairline: CGFloat = 1
        static let xs: CGFloat = 4
        static let s: CGFloat = 8
        static let m: CGFloat = 12
        static let l: CGFloat = 16
        static let xl: CGFloat = 24
        static let xxl: CGFloat = 32
    }

    enum Radius {
        static let bubble: CGFloat = 20
        /// The corner that points at its author, kept small instead of square so it
        /// still reads as a rounded bubble at large Dynamic Type sizes.
        static let bubbleTail: CGFloat = 6
        static let control: CGFloat = 22
        static let card: CGFloat = 16
    }

    enum Layout {
        /// Long replies are hard to read edge-to-edge on iPad, so the transcript is capped.
        static let maxTranscriptWidth: CGFloat = 720
        /// Share of the available width a single bubble may occupy.
        static let bubbleWidthFraction: CGFloat = 0.78
        static let composerMaxLines = 8
    }
}

extension Color {
    /// A colour that resolves per appearance, built from two hex literals.
    static func dynamic(light: UInt32, dark: UInt32) -> Color {
        Color(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(hex: dark) : UIColor(hex: light)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}
