import { versionIsAtLeast } from "../util";

export class FlutterCapabilities {
	public static get empty() { return new FlutterCapabilities("0.0.0"); }

	public version: string;

	constructor(flutterVersion: string) {
		this.version = flutterVersion;
	}

	get supportsCreateSkeleton() { return versionIsAtLeast(this.version, "2.5.0"); }
	get supportsCreatingSamples() { return versionIsAtLeast(this.version, "1.0.0"); }
	get hasLatestStructuredErrorsWork() { return versionIsAtLeast(this.version, "1.21.0-5.0"); }
	get supportsFlutterCreateListSamples() { return versionIsAtLeast(this.version, "1.3.10"); }
	get supportsWSVMService() { return versionIsAtLeast(this.version, "1.18.0-5"); }
	get supportsWSDebugBackend() { return versionIsAtLeast(this.version, "1.21.0-0"); }
	get supportsWSInjectedClient() { return versionIsAtLeast(this.version, "2.1.0-13.0"); }
	get supportsExposeURL() { return versionIsAtLeast(this.version, "1.18.0-5"); }
	get supportsDartDefine() { return versionIsAtLeast(this.version, "1.17.0"); }
	get supportsRestartDebounce() { return versionIsAtLeast(this.version, "1.21.0-0"); }
	get supportsRunSkippedTests() { return versionIsAtLeast(this.version, "2.1.0-11"); }
	get supportsShowWebServerDevice() { return versionIsAtLeast(this.version, "1.26.0-0"); }
	get supportsWebRendererOption() { return versionIsAtLeast(this.version, "1.25.0-0"); }
	get supportsDevToolsServerAddress() { return versionIsAtLeast(this.version, "1.26.0-12"); }
	get supportsRunningIntegrationTests() { return versionIsAtLeast(this.version, "2.2.0-10"); }
	// TODO: Set this to a version that includes a fix for both the Env issue (which needs
	//       DDS >= 2.2 in Flutter) and https://github.com/dart-lang/webdev/issues/1627 so web
	//       works, before removing previewSdkDAPs.
	get supportsSDKDAP() { return versionIsAtLeast(this.version, "2.13.0-0"); }
	// TODO: Set this to same as above (or remove) once DDS > 2.2 is in Flutter.
	get supportsEnvInSDKDAP() { return false; }
	// TODO: Set this to same as above (or remove) once fixed.
	get supportsWebInSDKDAP() { return false; }
	get requiresDDSDisabledForSDKDAPTestRuns() { return !versionIsAtLeast(this.version, "3.1.0"); }
	// TODO: Update these (along with Dart) when supported.
	get webSupportsEvaluation() { return false; }
	get webSupportsDebugging() { return true; }
	get webSupportsHotReload() { return false; }
}

export class DaemonCapabilities {
	public static get empty() { return new DaemonCapabilities("0.0.0"); }

	public version: string;

	constructor(daemonProtocolVersion: string) {
		this.version = daemonProtocolVersion;
	}

	get canCreateEmulators() { return versionIsAtLeast(this.version, "0.4.0"); }
	get canFlutterAttach() { return versionIsAtLeast(this.version, "0.4.1"); }
	get providesPlatformTypes() { return versionIsAtLeast(this.version, "0.5.2"); }
	get supportsAVDColdBootLaunch() { return versionIsAtLeast(this.version, "0.6.1"); }
}