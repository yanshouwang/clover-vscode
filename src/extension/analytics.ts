import * as https from "https";
import * as querystring from "querystring";
import { env, Uri, version as codeVersion, workspace } from "vscode";
import { dartCodeExtensionIdentifier, isChromeOS, isDartCodeTestRun } from "../shared/constants";
import { Logger } from "../shared/interfaces";
import { extensionVersion, hasFlutterExtension, isDevExtension } from "../shared/vscode/extension_util";
import { WorkspaceContext } from "../shared/workspace";
import { config } from "./config";

// Set to true for analytics to be sent to the debug endpoint (non-logging) for validation.
// This is only required for debugging analytics and needn't be sent for standard Dart Code development (dev hits are already filtered with isDevelopment).
const debug = false;

/// Analytics require that we send a value for uid or cid, but when running in the VS Code
// dev host we don't have either.
const sendAnalyticsFromExtensionDevHost = false;

// Machine ID is not set for extension dev host unless the boolean above is set to true (which
// is usually done for testing purposes).
const machineId = env.machineId !== "someValue.machineId"
    ? env.machineId
    : (sendAnalyticsFromExtensionDevHost ? "35009a79-1a05-49d7-dede-dededededede" : undefined);

enum Category {
    extension,
    analyzer,
    debugger,
    flutterSurvey,
}

enum EventAction {
    activated,
    sdkDetectionFailure,
    deactivated,
    restart,
    hotReload,
    openObservatory,
    openTimeline,
    openDevTools,
    shown,
    clicked,
    dismissed,
}

enum TimingVariable {
    startup,
    firstAnalysis,
    sessionDuration,
}

export class Analytics {
    public sdkVersion?: string;
    public flutterSdkVersion?: string;
    public analysisServerVersion?: string;
    private readonly formatter: string;
    private readonly dummyDartFile = Uri.parse("untitled:foo.dart");
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    private readonly dartConfig = workspace.getConfiguration("", this.dummyDartFile).get("[dart]") as any;

    // If analytics fail, they will be disabled for the rest of the session.
    private disableAnalyticsForSession = false;

    constructor(private readonly logger: Logger, public workspaceContext: WorkspaceContext) {
        this.formatter = this.getFormatterSetting();
    }

    private getFormatterSetting(): string {
        try {
            // If there are multiple formatters for Dart, the user can select one, so check
            // that first so we don't record their formatter being enabled as ours.
            const otherDefaultFormatter = this.getAppliedConfig("editor", "defaultFormatter", false);
            if (otherDefaultFormatter && otherDefaultFormatter !== dartCodeExtensionIdentifier) {
                return otherDefaultFormatter;
            }

            // If the user has explicitly disabled ours (without having another selected
            // then record that).
            if (!config.enableSdkFormatter) {
                return "Disabled";
            }

            // Otherwise record as enabled (and whether on-save).
            return this.getAppliedConfig("editor", "formatOnSave")
                ? "Enabled on Save"
                : "Enabled";
        } catch {
            return "Unknown";
        }
    }

    private getAppliedConfig(section: string, key: string, isResourceScoped = true) {
        const dartValue = this.dartConfig ? this.dartConfig[`${section}.${key}`] : undefined;
        return dartValue !== undefined && dartValue !== null
            ? dartValue
            : workspace.getConfiguration(section, isResourceScoped ? this.dummyDartFile : undefined).get(key);
    }

    public logExtensionStartup(timeInMS: number) {
        this.event(Category.extension, EventAction.activated).catch((e) => this.logger.info(`${e}`));
        this.time(Category.extension, TimingVariable.startup, timeInMS).catch((e) => this.logger.info(`${e}`));
    }
    public logExtensionRestart(timeInMS: number) {
        this.event(Category.extension, EventAction.restart).catch((e) => this.logger.info(`${e}`));
        this.time(Category.extension, TimingVariable.startup, timeInMS).catch((e) => this.logger.info(`${e}`));
    }
    public logAnalyzerRestart() {
        this.event(Category.analyzer, EventAction.restart).catch((e) => this.logger.info(`${e}`));
    }
    public logExtensionShutdown(): PromiseLike<void> { return this.event(Category.extension, EventAction.deactivated); }
    public logSdkDetectionFailure() { this.event(Category.extension, EventAction.sdkDetectionFailure).catch((e) => this.logger.info(`${e}`)); }
    public logError(description: string, fatal: boolean) { this.error(description, fatal).catch((e) => this.logger.info(`${e}`)); }
    public logAnalyzerStartupTime(timeInMS: number) { this.time(Category.analyzer, TimingVariable.startup, timeInMS).catch((e) => this.logger.info(`${e}`)); }
    public logDebugSessionDuration(debuggerType: string, timeInMS: number) { this.time(Category.debugger, TimingVariable.sessionDuration, timeInMS, debuggerType).catch((e) => this.logger.info(`${e}`)); }
    public logAnalyzerFirstAnalysisTime(timeInMS: number) { this.time(Category.analyzer, TimingVariable.firstAnalysis, timeInMS).catch((e) => this.logger.info(`${e}`)); }
    public logDebuggerStart(resourceUri: Uri | undefined, debuggerType: string, runType: string) {
        const customData = {
            cd15: debuggerType,
            cd16: runType,
        };
        this.event(Category.debugger, EventAction.activated, resourceUri, customData).catch((e) => this.logger.info(`${e}`));
    }
    public logDebuggerRestart() { this.event(Category.debugger, EventAction.restart).catch((e) => this.logger.info(`${e}`)); }
    public logDebuggerHotReload() { this.event(Category.debugger, EventAction.hotReload).catch((e) => this.logger.info(`${e}`)); }
    public logDebuggerOpenObservatory() { this.event(Category.debugger, EventAction.openObservatory).catch((e) => this.logger.info(`${e}`)); }
    public logDebuggerOpenTimeline() { this.event(Category.debugger, EventAction.openTimeline).catch((e) => this.logger.info(`${e}`)); }
    public logDebuggerOpenDevTools() { this.event(Category.debugger, EventAction.openDevTools).catch((e) => this.logger.info(`${e}`)); }
    public logFlutterSurveyShown() { this.event(Category.flutterSurvey, EventAction.shown).catch((e) => this.logger.info(`${e}`)); }
    public logFlutterSurveyClicked() { this.event(Category.flutterSurvey, EventAction.clicked).catch((e) => this.logger.info(`${e}`)); }
    public logFlutterSurveyDismissed() { this.event(Category.flutterSurvey, EventAction.dismissed).catch((e) => this.logger.info(`${e}`)); }

    private event(category: Category, action: EventAction, resourceUri?: Uri, customData?: any): Promise<void> {
        const data: any = {
            ea: EventAction[action],
            ec: Category[category],
            t: "event",
        };

        // Copy custom data over.
        Object.assign(data, customData);

        // Force a session start if this is extension activation.
        if (category === Category.extension && action === EventAction.activated) { data.sc = "start"; }

        // Force a session end if this is extension deactivation.
        if (category === Category.extension && action === EventAction.deactivated) { data.sc = "end"; }

        return this.send(data, resourceUri);
    }

    private time(category: Category, timingVariable: TimingVariable, timeInMS: number, label?: string) {
        const data: any = {
            t: "timing",
            utc: Category[category],
            utl: label,
            utt: Math.round(timeInMS),
            utv: TimingVariable[timingVariable],
        };

        this.logger.info(`${data.utc}:${data.utv} timing: ${Math.round(timeInMS)}ms ${label ? `(${label})` : ""}`);
        // if (isDevExtension)
        // 	console.log(`${data.utc}:${data.utv} timing: ${Math.round(timeInMS)}ms ${label ? `(${label})` : ""}`);

        return this.send(data);
    }

    private error(description: string, fatal: boolean) {
        const data: any = {
            exd: description.trim(),
            exf: fatal ? 1 : 0,
            t: "exception",
        };

        return this.send(data);
    }

    private async send(customData: any, resourceUri?: Uri): Promise<void> {
        if (this.disableAnalyticsForSession
            || !machineId
            || !config.allowAnalytics /* Kept for users that opted-out when we used own flag */
            || !this.workspaceContext.config.disableAnalytics
            || !env.isTelemetryEnabled
            || isDartCodeTestRun
        ) { return; }

        const data = {
            aip: 1,
            an: "Dart Code",
            av: extensionVersion,
            cd1: isDevExtension,
            cd10: config.showTodos ? "On" : "Off",
            cd11: this.workspaceContext.config.useLSP ? "LSP" : "DAS",
            cd12: this.formatter,
            cd13: this.flutterSdkVersion,
            cd14: hasFlutterExtension ? "Installed" : "Not Installed",
            cd17: this.workspaceContext.hasAnyFlutterProjects
                ? (config.previewFlutterUiGuides ? (config.previewFlutterUiGuidesCustomTracking ? "On + Custom Tracking" : "On") : "Off")
                : null,
            // cd18: this.workspaceContext.hasAnyFlutterProjects && resourceUri
            // 	? config.for(resourceUri).flutterStructuredErrors ? "On" : "Off"
            // 	: null,
            cd19: env.remoteName || "None",
            cd2: isChromeOS ? `${process.platform} (ChromeOS)` : process.platform,
            cd20: env.appName || "Unknown",
            cd3: this.sdkVersion,
            cd4: this.analysisServerVersion,
            cd5: codeVersion,
            cd6: resourceUri ? this.getDebuggerPreference() : null,
            cd7: this.workspaceContext.workspaceTypeDescription,
            cd8: config.closingLabels ? "On" : "Off",
            cd9: this.workspaceContext.hasAnyFlutterProjects ? config.flutterHotReloadOnSave : null,
            // TODO: Auto-save
            // TODO: Hot-restart-on-save
            cid: machineId,
            tid: "UA-2201586-19",
            ul: env.language,
            v: "1", // API Version.
        };

        // Copy custom data over.
        Object.assign(data, customData);

        if (debug) { this.logger.info("Sending analytic: " + JSON.stringify(data)); }

        const options: https.RequestOptions = {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            hostname: "www.google-analytics.com",
            method: "POST",
            path: debug ? "/debug/collect" : "/collect",
            port: 443,
        };

        await new Promise<void>((resolve) => {
            try {
                const req = https.request(options, (resp) => {
                    if (debug) {
                        resp.on("data", (c: Buffer | string) => {
                            try {
                                const gaDebugResp = JSON.parse(c.toString());
                                if (gaDebugResp && gaDebugResp.hitParsingResult && gaDebugResp.hitParsingResult[0].valid === true) {
                                    this.logger.info("Sent OK!");
                                }
                                else if (gaDebugResp && gaDebugResp.hitParsingResult && gaDebugResp.hitParsingResult[0].valid === false) {
                                    this.logger.warn(c.toString());
                                }
                                else {
                                    this.logger.warn(`Unexpected GA debug response: ${c?.toString()}`);
                                }
                            } catch (e) {
                                this.logger.warn(`Error in GA debug response: ${c?.toString()}`);
                            }
                        });
                    }

                    if (!resp || !resp.statusCode || resp.statusCode < 200 || resp.statusCode > 300) {
                        this.logger.info(`Failed to send analytics ${resp && resp.statusCode}: ${resp && resp.statusMessage}`);
                    }
                    resolve();
                });
                req.write(querystring.stringify(data));
                req.on("error", (e) => {
                    this.handleError(e);
                    resolve();
                });
                req.end();
            } catch (e) {
                this.handleError(e);
                resolve();
            }
        });
    }

    private handleError(e: any) {
        this.logger.info(`Failed to send analytics, disabling for session: ${e}`);
        this.disableAnalyticsForSession = true;
    }

    private getDebuggerPreference(): string {
        if (config.debugSdkLibraries && config.debugExternalPackageLibraries) { return "All code"; }
        else if (config.debugSdkLibraries) { return "My code + SDK"; }
        else if (config.debugExternalPackageLibraries) { return "My code + Libraries"; }
        else { return "My code"; }
    }
}