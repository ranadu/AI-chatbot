import Foundation

/// The one thing the app needs from a backend: send text, get a reply.
/// Views and view models depend on this protocol, not on `URLSession`, so previews
/// and tests can substitute `PreviewChatService`.
protocol ChatService: Sendable {
    func sendMessage(_ text: String, memoryKey: String) async throws -> String
}

enum ChatServiceError: LocalizedError, Equatable {
    case invalidBaseURL(String)
    case offline
    case timedOut
    case httpStatus(Int)
    case backend(String)
    case emptyReply
    case malformedResponse

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL(let value):
            return "“\(value)” isn’t a valid server address."
        case .offline:
            return "You appear to be offline."
        case .timedOut:
            return "The assistant took too long to respond."
        case .httpStatus(let code):
            return "The server returned an error (HTTP \(code))."
        case .backend(let message):
            return message
        case .emptyReply:
            return "The assistant sent back an empty reply."
        case .malformedResponse:
            return "The server sent a response the app couldn’t read."
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .invalidBaseURL:
            return "Check the server address in Settings."
        case .offline:
            return "Check your connection and try again."
        case .timedOut, .httpStatus, .malformedResponse, .emptyReply:
            return "Tap Retry to send it again."
        case .backend:
            return nil
        }
    }
}
