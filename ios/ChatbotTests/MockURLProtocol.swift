import Foundation

/// Intercepts requests so `ChatAPIClient` can be tested against canned responses.
///
/// `URLProtocol` runs on URLSession's own threads, so everything shared with the test
/// thread — the handler and anything it records — goes through a lock. Without that,
/// Swift's exclusivity checks trap and take the whole test process down.
final class MockURLProtocol: URLProtocol {
    typealias Handler = @Sendable (URLRequest) throws -> (HTTPURLResponse, Data)

    private static let lock = NSLock()
    nonisolated(unsafe) private static var storedHandler: Handler?

    static var handler: Handler? {
        get { lock.withLock { storedHandler } }
        set { lock.withLock { storedHandler = newValue } }
    }

    /// A session wired to this protocol. `ephemeral` keeps caches out of the way.
    static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [MockURLProtocol.self]
        return URLSession(configuration: configuration)
    }

    static func respond(status: Int = 200, json: String) {
        handler = { request in
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: status,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            )!
            return (response, Data(json.utf8))
        }
    }

    static func fail(with error: URLError) {
        handler = { _ in throw error }
    }

    /// Records the request, then answers with `json`.
    static func respond(status: Int = 200, json: String, into recorder: RequestRecorder) {
        handler = { request in
            recorder.record(request)
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: status,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            )!
            return (response, Data(json.utf8))
        }
    }

    override class func canInit(with request: URLRequest) -> Bool { true }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.handler else {
            client?.urlProtocol(self, didFailWithError: URLError(.resourceUnavailable))
            return
        }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

/// Carries a request from the URLProtocol thread back to the test thread.
final class RequestRecorder: @unchecked Sendable {
    private let lock = NSLock()
    private var storage: URLRequest?

    /// The body has to be read here: by the time the test looks, the stream is spent.
    private var storedBody: Data?

    var request: URLRequest? { lock.withLock { storage } }
    var body: Data? { lock.withLock { storedBody } }

    func record(_ request: URLRequest) {
        let body = request.readBody()
        lock.withLock {
            storage = request
            storedBody = body
        }
    }
}

private extension URLRequest {
    /// `httpBody` is nil once URLSession has turned it into a stream, so read either.
    func readBody() -> Data? {
        if let httpBody { return httpBody }
        guard let stream = httpBodyStream else { return nil }
        stream.open()
        defer { stream.close() }
        var data = Data()
        let bufferSize = 1024
        var buffer = [UInt8](repeating: 0, count: bufferSize)
        while stream.hasBytesAvailable {
            let read = stream.read(&buffer, maxLength: bufferSize)
            if read <= 0 { break }
            data.append(buffer, count: read)
        }
        return data
    }
}
