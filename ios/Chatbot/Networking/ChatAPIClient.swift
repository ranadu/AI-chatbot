import Foundation

/// Talks to the FastAPI backend in `backend/main.py`.
///
/// Contract:
///   `POST {baseURL}/chat`  body `{"user": String, "message": String}`
///   → `{"response": String}` on success, `{"error": String}` on an upstream failure.
struct ChatAPIClient: ChatService {
    let baseURL: URL
    let session: URLSession

    init(baseURL: URL, session: URLSession = .chatbotDefault) {
        self.baseURL = baseURL
        self.session = session
    }

    private struct Request: Encodable {
        let user: String
        let message: String
    }

    private struct Response: Decodable {
        let response: String?
        let error: String?
    }

    func sendMessage(_ text: String, memoryKey: String) async throws -> String {
        var request = URLRequest(url: baseURL.appending(path: "chat"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(Request(user: memoryKey, message: text))

        let data: Data
        let urlResponse: URLResponse
        do {
            (data, urlResponse) = try await session.data(for: request)
        } catch let error as URLError {
            switch error.code {
            case .notConnectedToInternet, .networkConnectionLost, .dataNotAllowed:
                throw ChatServiceError.offline
            case .timedOut:
                throw ChatServiceError.timedOut
            case .cancelled:
                // URLSession reports cancellation its own way; surface it as Swift's, so
                // callers can treat "the user stopped it" separately from a real failure.
                throw CancellationError()
            default:
                throw ChatServiceError.backend(error.localizedDescription)
            }
        }

        if let http = urlResponse as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            // The backend answers 200 even for upstream failures, so a non-2xx is a real HTTP problem.
            throw ChatServiceError.httpStatus(http.statusCode)
        }

        let decoded: Response
        do {
            decoded = try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw ChatServiceError.malformedResponse
        }

        if let error = decoded.error, !error.isEmpty {
            throw ChatServiceError.backend(Self.summarize(error))
        }

        let reply = decoded.response?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !reply.isEmpty else { throw ChatServiceError.emptyReply }
        return reply
    }

    /// Upstream errors arrive as a raw provider JSON blob; show the useful sentence, not the blob.
    private static func summarize(_ raw: String) -> String {
        if let data = raw.data(using: .utf8),
           let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let error = object["error"] as? [String: Any],
           let message = error["message"] as? String {
            return message
        }
        return raw.count > 240 ? String(raw.prefix(240)) + "…" : raw
    }
}

extension URLSession {
    /// Chat replies are generated, not fetched — allow a generous window but not forever.
    static let chatbotDefault: URLSession = {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 60
        configuration.timeoutIntervalForResource = 120
        configuration.waitsForConnectivity = false
        return URLSession(configuration: configuration)
    }()
}
