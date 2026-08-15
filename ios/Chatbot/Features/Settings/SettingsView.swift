import SwiftUI

/// Server address, identity, and input behaviour. Presented as a sheet from the sidebar.
struct SettingsView: View {
    @Environment(AppSettings.self) private var settings
    @Environment(\.dismiss) private var dismiss

    @State private var connectionState = ConnectionState.idle

    private enum ConnectionState: Equatable {
        case idle
        case checking
        case reachable
        case failed(String)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("https://example.onrender.com", text: Binding(
                        get: { settings.baseURLString },
                        set: { settings.baseURLString = $0 }
                    ))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                    .onChange(of: settings.baseURLString) { _, _ in connectionState = .idle }

                    HStack {
                        Button("Test Connection") { Task { await testConnection() } }
                            .disabled(connectionState == .checking)
                        Spacer()
                        connectionStatus
                    }
                } header: {
                    Text("Server")
                } footer: {
                    Text("The FastAPI backend from this repository. Use http://localhost:8000 when running it on your Mac — the app allows local networking for development.")
                }

                Section {
                    TextField("Name", text: Binding(
                        get: { settings.userID },
                        set: { settings.userID = $0 }
                    ))
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()

                    Toggle("Separate memory per chat", isOn: Binding(
                        get: { settings.scopedMemoryPerConversation },
                        set: { settings.scopedMemoryPerConversation = $0 }
                    ))
                } header: {
                    Text("Identity")
                } footer: {
                    Text("The backend recalls your last few turns using this name. With separate memory on, each chat gets its own slice, so parallel conversations don't bleed into each other.")
                }

                Section {
                    Toggle("Return key sends", isOn: Binding(
                        get: { settings.sendOnReturn },
                        set: { settings.sendOnReturn = $0 }
                    ))
                } header: {
                    Text("Composing")
                } footer: {
                    Text("⌘Return always sends, whichever way this is set.")
                }

                Section {
                    LabeledContent("Version", value: Self.versionString)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    @ViewBuilder
    private var connectionStatus: some View {
        switch connectionState {
        case .idle:
            EmptyView()
        case .checking:
            ProgressView()
        case .reachable:
            Label("Reachable", systemImage: "checkmark.circle.fill")
                .foregroundStyle(.green)
                .font(.footnote)
        case .failed(let message):
            Label(message, systemImage: "xmark.circle.fill")
                .foregroundStyle(Theme.Palette.danger)
                .font(.footnote)
                .multilineTextAlignment(.trailing)
        }
    }

    /// Sends a throwaway message rather than pinging a health route, because `/chat` is
    /// the only endpoint the backend exposes.
    private func testConnection() async {
        connectionState = .checking
        let service = settings.makeService()
        do {
            _ = try await service.sendMessage("ping", memoryKey: "\(settings.effectiveUserID)#connection-test")
            connectionState = .reachable
        } catch let error as ChatServiceError {
            connectionState = .failed(error.errorDescription ?? "Failed")
        } catch {
            connectionState = .failed(error.localizedDescription)
        }
    }

    private static var versionString: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "\(short) (\(build))"
    }
}

#Preview {
    SettingsView()
        .environment(AppSettings(defaults: .previewDefaults))
}
