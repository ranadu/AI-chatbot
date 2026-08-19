import Foundation
import Testing

@testable import Chatbot

@Suite("ChatAPIClient", .serialized)
struct ChatAPIClientTests {
    private let baseURL = URL(string: "https://example.test")!

    private func makeClient() -> ChatAPIClient {
        ChatAPIClient(baseURL: baseURL, session: MockURLProtocol.makeSession())
    }

    @Test("Posts to /chat with the memory key as the user field")
    func requestShape() async throws {
        let recorder = RequestRecorder()
        MockURLProtocol.respond(json: #"{"response":"ok"}"#, into: recorder)

        _ = try await makeClient().sendMessage("Hello", memoryKey: "robert#abc123")

        let request = try #require(recorder.request)
        #expect(request.httpMethod == "POST")
        #expect(request.url?.path() == "/chat")
        #expect(request.value(forHTTPHeaderField: "Content-Type") == "application/json")

        let body = try #require(recorder.body)
        let json = try #require(try JSONSerialization.jsonObject(with: body) as? [String: String])
        #expect(json["user"] == "robert#abc123")
        #expect(json["message"] == "Hello")
    }

    @Test("Trims whitespace from the reply")
    func trimsReply() async throws {
        MockURLProtocol.respond(json: #"{"response":"  Hello there \n"}"#)
        let reply = try await makeClient().sendMessage("hi", memoryKey: "robert")
        #expect(reply == "Hello there")
    }

    @Test("Unwraps the provider's nested error message")
    func unwrapsProviderError() async {
        // The backend forwards the upstream body verbatim in its `error` field.
        MockURLProtocol.respond(json: #"{"error":"{\"error\":{\"message\":\"Rate limit reached\",\"type\":\"tokens\"}}"}"#)
        await #expect(throws: ChatServiceError.backend("Rate limit reached")) {
            try await makeClient().sendMessage("hi", memoryKey: "robert")
        }
    }

    @Test("Truncates an unparseable error instead of showing the whole payload")
    func truncatesRawError() async throws {
        let raw = String(repeating: "x", count: 300)
        MockURLProtocol.respond(json: #"{"error":"\#(raw)"}"#)

        do {
            _ = try await makeClient().sendMessage("hi", memoryKey: "robert")
            Issue.record("Expected the client to throw")
        } catch let error as ChatServiceError {
            guard case .backend(let message) = error else {
                Issue.record("Expected .backend, got \(error)")
                return
            }
            #expect(message.count == 241)
            #expect(message.hasSuffix("…"))
        }
    }

    @Test("Treats a blank reply as an error rather than an empty bubble")
    func emptyReply() async {
        MockURLProtocol.respond(json: #"{"response":"   "}"#)
        await #expect(throws: ChatServiceError.emptyReply) {
            try await makeClient().sendMessage("hi", memoryKey: "robert")
        }
    }

    @Test("Surfaces a non-2xx status")
    func httpFailure() async {
        MockURLProtocol.respond(status: 503, json: #"{}"#)
        await #expect(throws: ChatServiceError.httpStatus(503)) {
            try await makeClient().sendMessage("hi", memoryKey: "robert")
        }
    }

    @Test("Reports unreadable JSON distinctly")
    func malformedResponse() async {
        MockURLProtocol.respond(json: "<html>gateway error</html>")
        await #expect(throws: ChatServiceError.malformedResponse) {
            try await makeClient().sendMessage("hi", memoryKey: "robert")
        }
    }

    @Test("Maps connectivity failures to .offline")
    func offline() async {
        MockURLProtocol.fail(with: URLError(.notConnectedToInternet))
        await #expect(throws: ChatServiceError.offline) {
            try await makeClient().sendMessage("hi", memoryKey: "robert")
        }
    }

    @Test("Maps a cancelled request to CancellationError, not a failure")
    func cancellation() async {
        MockURLProtocol.fail(with: URLError(.cancelled))
        await #expect(throws: CancellationError.self) {
            try await makeClient().sendMessage("hi", memoryKey: "robert")
        }
    }
}
