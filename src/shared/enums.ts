export enum DebuggerType {
    dart,
    dartTest,
    flutter,
    flutterTest,
    web,
    webTest,
}

export enum TestStatus {
    // This should be in order such that the highest number is the one to show
    // when aggregating (eg. from children).
    waiting,
    skipped,
    passed,
    unknown,
    failed,
    running,
}

/// The service extensions we know about.
export enum VMServiceExtension {
    platformOverride = "ext.flutter.platformOverride",
    debugBanner = "ext.flutter.debugAllowBanner",
    debugPaint = "ext.flutter.debugPaint",
    driver = "ext.flutter.driver",
    paintBaselines = "ext.flutter.debugPaintBaselinesEnabled",
    inspectorSelectMode = "ext.flutter.inspector.show",
    inspectorSetPubRootDirectories = "ext.flutter.inspector.setPubRootDirectories",
    brightnessOverride = "ext.flutter.brightnessOverride",
    repaintRainbow = "ext.flutter.repaintRainbow",
    performanceOverlay = "ext.flutter.showPerformanceOverlay",
    slowAnimations = "ext.flutter.timeDilation",
}

/// The service extensions we know about and allow toggling via commands.
export enum VMService {
    hotReload = "reloadSources",
    hotRestart = "hotRestart",
    launchDevTools = "launchDevTools",
}

export enum VersionStatus {
    notInstalled,
    updateRequired,
    updateAvailable,
    valid,
}

export enum LogCategory {
    general,
    ci,
    commandProcesses,
    dap,
    devTools,
    analyzer,
    analyzerTiming,
    dartTest,
    flutterDaemon,
    flutterRun,
    flutterTest,
    vmService,
    webDaemon,
}

export enum LogSeverity {
    info,
    warn,
    error,
}

export const debugOptionNames = ["my code", "my code + packages", "my code + packages + SDK", "my code + SDK"];
export enum DebugOption {
    myCode,
    myCodePackages,
    myCodePackagesSDK,
    myCodeSDK,
}