# Chatbot for iOS & iPadOS

A native SwiftUI client for the FastAPI backend in [`backend/`](../backend). It's a sibling
of `vite_frontend/` (web) and `frontend/` (Expo) — same server, same palette, but built
around the platform instead of ported onto it.

Requires Xcode 16 or later. Targets iOS/iPadOS 18.0+. No third-party dependencies.

```bash
open ios/ChatbotApp.xcodeproj
```

Then pick the **Chatbot** scheme and run. From the command line:

```bash
xcodebuild -project ios/ChatbotApp.xcodeproj -scheme Chatbot -destination 'generic/platform=iOS Simulator' build
```

## Pointing it at a server

Settings (gear, top-left of the sidebar) holds the server address. It defaults to the
deployed backend, the same one the web client uses. To run against a local backend:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

…then set the address to `http://localhost:8000` on the Simulator, or
`http://<your-mac-ip>:8000` on a device. `Config/Info.plist` allows local networking so
plain HTTP works for development; anything else still requires HTTPS.

**Test Connection** in Settings sends a throwaway `ping` — `/chat` is the only endpoint
the backend exposes, so there's no health route to hit.

## Layout

```
ios/
├── ChatbotApp.xcodeproj        Uses a synchronized folder group — new files in
│                               Chatbot/ join the target with no project edits
├── Config/Info.plist           Orientations, scenes, ATS exception for localhost
├── Tools/GenerateAppIcon.swift Regenerates the app icon (not part of the target)
└── Chatbot/
    ├── App/                    ChatbotApp (entry + ⌘N), RootView (split view), AppSettings
    ├── Features/
    │   ├── Chat/               ChatView, ChatViewModel, MessageBubble, ComposerView,
    │   │                       TypingIndicator
    │   ├── Conversations/      ConversationListView (sidebar: search, rename, delete)
    │   └── Settings/           SettingsView
    ├── Models/                 Conversation, Message (SwiftData @Model)
    ├── Networking/             ChatService protocol, ChatAPIClient, typed errors
    ├── Persistence/            ChatStore — container, seeding, deletes
    ├── DesignSystem/           Theme (colour/spacing/radius tokens), MarkdownText
    ├── Resources/              Assets.xcassets (AppIcon slot, AccentColor)
    └── Preview Content/        PreviewChatService — canned replies, no network
```

## Design decisions

**One layout for both idioms.** `RootView` is a single `NavigationSplitView`: sidebar of
conversations beside the transcript on iPad, collapsed into a push stack on iPhone by the
system. There is no size-class branching to keep in sync.

**Conversations are local; memory is scoped to match.** The backend recalls your last five
turns keyed by whatever string arrives in its `user` field. Several parallel threads would
otherwise share one memory and bleed into each other, so each `Conversation` derives a
`memoryKey` of `userID#<short-uuid>` — no backend change needed. Turn *Separate memory per
chat* off in Settings to fall back to one shared memory.

**Transcript width is capped.** Replies read badly across 13 inches of iPad, so the column
stops at 720pt and centres (`Theme.Layout.maxTranscriptWidth`).

**Failures live in the transcript.** A send that fails marks its bubble *Not delivered* and
keeps it retryable; the banner explains what happened and how to fix it. `ChatServiceError`
distinguishes offline, timeout, HTTP, and upstream-provider errors, and unwraps the
provider's JSON blob down to its message so the user sees a sentence, not a payload.

**Assistant replies render Markdown.** The model emits `**bold**`, lists, and links;
`MarkdownText` parses with `.full` syntax so paragraph breaks survive. User text is
rendered verbatim — it was never Markdown.

**Platform conventions, not web ones.** Dynamic Type throughout, dark mode via paired
colour tokens rather than a second stylesheet, Reduce Motion handled in `TypingIndicator`,
swipe-to-delete and context menus in the sidebar, copy/share on any bubble, `ShareLink` for
transcripts, and hardware-keyboard support: ⌘N for a new chat, ⌘Return to send, with
Return-to-send toggleable.

## App icon

A robot head — the same 🤖 the web client leads with — drawn in the app's own bubble
silhouette, with the tighter corner at the bottom-left. The eyes, mouth and antenna are
cut *through* the glyph rather than filled, which is what lets one piece of artwork serve
all three iOS appearance variants: the light entry carries the brand gradient, while the
dark and tinted entries are transparent so iOS composites its own background behind them.

The artwork is generated, not hand-drawn, so it stays reproducible:

```bash
swift ios/Tools/GenerateAppIcon.swift ios/Chatbot/Resources/Assets.xcassets/AppIcon.appiconset
```

That writes `AppIcon.png`, `AppIcon-Dark.png` and `AppIcon-Tinted.png` at 1024×1024 and
also drops an `appicon-preview.png` contact sheet showing each variant at Home Screen,
Spotlight and Settings sizes. Edit the constants at the top of the script to adjust the
mark; `Contents.json` already maps the three files to their appearances.

## What isn't here

- **No streaming.** `/chat` returns one complete JSON reply, so the app shows a typing
  indicator rather than tokens as they arrive. If the backend gains SSE, `ChatService`
  is the seam to change — swap the return for an `AsyncStream<String>`.
- **No auth.** The backend has none; `userID` is an identifier, not a credential.
- **No test target.** `ChatService` and `PreviewChatService` are already shaped for one —
  add a unit-test target and inject the fake.
