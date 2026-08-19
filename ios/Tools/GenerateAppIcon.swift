import AppKit
import CoreGraphics
import CoreText
import Foundation

// Produces the final AppIcon set for the Chatbot iOS app.
// Usage: swift GenerateAppIcon.swift <appiconset-dir> [preview-dir]
//
// The optional second argument writes a contact sheet of all three variants at Home
// Screen, Spotlight and Settings sizes. Leave it off when writing into the asset catalog:
// Xcode flags files it doesn't expect inside an .appiconset.
//
// The mark is one glyph — a robot head in the app's bubble silhouette, with the eyes,
// mouth and antenna cut through it. Because the features are holes rather than filled
// shapes, the same artwork works for all three iOS appearance variants: over the brand
// gradient (light), and over the system-supplied background (dark and tinted).

let outputDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."

func rgb(_ hex: UInt32, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(
        red: CGFloat((hex >> 16) & 0xFF) / 255,
        green: CGFloat((hex >> 8) & 0xFF) / 255,
        blue: CGFloat(hex & 0xFF) / 255,
        alpha: alpha
    )
}

let brandLight: UInt32 = 0x4B8BF8
let brandDeep: UInt32 = 0x1D4ED8

func context(size: CGFloat) -> CGContext {
    CGContext(
        data: nil, width: Int(size), height: Int(size), bitsPerComponent: 8, bytesPerRow: 0,
        space: CGColorSpace(name: CGColorSpace.sRGB)!,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )!
}

/// The app's bubble: three generous corners, one tighter corner at the bottom-left.
func bubblePath(in rect: CGRect, radius r: CGFloat, tailRadius tr: CGFloat) -> CGPath {
    let path = CGMutablePath()
    let x = rect.minX, y = rect.minY, w = rect.width, h = rect.height
    path.move(to: CGPoint(x: x + tr, y: y))
    path.addLine(to: CGPoint(x: x + w - r, y: y))
    path.addArc(tangent1End: CGPoint(x: x + w, y: y), tangent2End: CGPoint(x: x + w, y: y + r), radius: r)
    path.addLine(to: CGPoint(x: x + w, y: y + h - r))
    path.addArc(tangent1End: CGPoint(x: x + w, y: y + h), tangent2End: CGPoint(x: x + w - r, y: y + h), radius: r)
    path.addLine(to: CGPoint(x: x + r, y: y + h))
    path.addArc(tangent1End: CGPoint(x: x, y: y + h), tangent2End: CGPoint(x: x, y: y + h - r), radius: r)
    path.addLine(to: CGPoint(x: x, y: y + tr))
    path.addArc(tangent1End: CGPoint(x: x, y: y), tangent2End: CGPoint(x: x + tr, y: y), radius: tr)
    path.closeSubpath()
    return path
}

/// White glyph on transparent, features punched through.
func makeGlyph(size s: CGFloat) -> CGImage {
    let ctx = context(size: s)
    let u = s / 1024

    ctx.setFillColor(rgb(0xFFFFFF))

    // Antenna: stem rooted in the head, ball on top.
    ctx.addPath(CGPath(
        roundedRect: CGRect(x: 496 * u, y: 744 * u, width: 34 * u, height: 96 * u),
        cornerWidth: 17 * u, cornerHeight: 17 * u, transform: nil
    ))
    ctx.fillPath()
    ctx.addEllipse(in: CGRect(x: 469 * u, y: 810 * u, width: 86 * u, height: 86 * u))
    ctx.fillPath()

    // Head, in the app's bubble silhouette.
    let head = CGRect(x: 196 * u, y: 264 * u, width: 632 * u, height: 496 * u)
    ctx.addPath(bubblePath(in: head, radius: 176 * u, tailRadius: 48 * u))
    ctx.fillPath()

    // Features, cut through the glyph so every appearance variant works.
    ctx.setBlendMode(.destinationOut)
    ctx.setFillColor(rgb(0x000000))
    let eyeR = 76 * u
    let eyeY = head.midY + 26 * u
    for x in [head.midX - 130 * u, head.midX + 130 * u] {
        ctx.addEllipse(in: CGRect(x: x - eyeR, y: eyeY - eyeR, width: eyeR * 2, height: eyeR * 2))
        ctx.fillPath()
    }
    // Tall enough to survive the 40pt Settings size, where a hairline mouth vanishes.
    ctx.addPath(CGPath(
        roundedRect: CGRect(x: head.midX - 96 * u, y: head.minY + 86 * u, width: 192 * u, height: 56 * u),
        cornerWidth: 28 * u, cornerHeight: 28 * u, transform: nil
    ))
    ctx.fillPath()
    ctx.setBlendMode(.normal)

    return ctx.makeImage()!
}

enum Variant: String {
    case light = "AppIcon"
    case dark = "AppIcon-Dark"
    case tinted = "AppIcon-Tinted"
}

func draw(_ variant: Variant, size s: CGFloat) -> CGImage {
    let ctx = context(size: s)
    let rect = CGRect(x: 0, y: 0, width: s, height: s)

    if variant == .light {
        // Opaque brand gradient — the light variant must fill the whole canvas.
        let gradient = CGGradient(
            colorsSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
            colors: [rgb(brandLight), rgb(brandDeep)] as CFArray,
            locations: [0, 1]
        )!
        ctx.saveGState()
        ctx.addRect(rect)
        ctx.clip()
        ctx.drawLinearGradient(
            gradient,
            start: CGPoint(x: rect.minX, y: rect.maxY),
            end: CGPoint(x: rect.maxX, y: rect.minY),
            options: []
        )
        ctx.restoreGState()
    }
    // Dark and tinted stay transparent: iOS composites them over its own background.

    ctx.draw(makeGlyph(size: s), in: rect)
    return ctx.makeImage()!
}

func write(_ image: CGImage, to path: String) {
    guard let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: path) as CFURL, "public.png" as CFString, 1, nil) else {
        fatalError("Could not create \(path)")
    }
    CGImageDestinationAddImage(dest, image, nil)
    CGImageDestinationFinalize(dest)
}

for variant in [Variant.light, .dark, .tinted] {
    write(draw(variant, size: 1024), to: "\(outputDir)/\(variant.rawValue).png")
}

// MARK: - Preview sheet

func masked(_ image: CGImage, size s: CGFloat, background: CGColor?) -> CGImage {
    let ctx = context(size: s)
    let rect = CGRect(x: 0, y: 0, width: s, height: s)
    ctx.addPath(CGPath(roundedRect: rect, cornerWidth: s * 0.2237, cornerHeight: s * 0.2237, transform: nil))
    ctx.clip()
    if let background {
        ctx.setFillColor(background)
        ctx.fill(rect)
    }
    ctx.draw(image, in: rect)
    return ctx.makeImage()!
}

func drawText(_ ctx: CGContext, _ string: String, at point: CGPoint, size: CGFloat, color: CGColor) {
    let font = CTFontCreateUIFontForLanguage(.system, size, nil)!
    let line = CTLineCreateWithAttributedString(NSAttributedString(
        string: string,
        attributes: [.font: font, .foregroundColor: NSColor(cgColor: color)!]
    ))
    ctx.textPosition = point
    CTLineDraw(line, ctx)
}

do {
    // Stand-ins for what iOS puts behind the dark and tinted variants.
    let cases: [(Variant, String, CGColor?)] = [
        (.light, "Light", nil),
        (.dark, "Dark", rgb(0x1C1C1E)),
        (.tinted, "Tinted", rgb(0x4A4A6A)),
    ]
    let cell: CGFloat = 300
    let gap: CGFloat = 44
    let sheetW = cell * 3 + gap * 4
    let sheetH = cell + 150 + gap * 2
    let ctx = context(size: max(sheetW, sheetH))
    ctx.setFillColor(rgb(0x1A1A1C))
    ctx.fill(CGRect(x: 0, y: 0, width: sheetW, height: sheetH))

    for (index, entry) in cases.enumerated() {
        let (variant, label, background) = entry
        let x = gap + CGFloat(index) * (cell + gap)
        let top = sheetH - gap
        ctx.draw(masked(draw(variant, size: 600), size: 600, background: background), in: CGRect(x: x, y: top - cell, width: cell, height: cell))
        drawText(ctx, label, at: CGPoint(x: x, y: top - cell - 30), size: 22, color: rgb(0xF2F3F5))
        var smallX = x
        for small in [CGFloat(120), 80, 58] {
            ctx.draw(masked(draw(variant, size: 240), size: 240, background: background), in: CGRect(x: smallX, y: top - cell - 150 + 22, width: small, height: small))
            smallX += small + 18
        }
    }

    let cropped = ctx.makeImage()!.cropping(to: CGRect(x: 0, y: Int(max(sheetW, sheetH) - sheetH), width: Int(sheetW), height: Int(sheetH)))!
    write(cropped, to: "\(outputDir)/appicon-preview.png")
}

print("Wrote AppIcon variants to \(outputDir)")
