// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as util from "./util";
import { DartCapabilities } from '../shared/capabilities/dart';
import { vscodeCapabilities } from '../shared/capabilities/vscode';
import { SnippetCompletionItemProvider } from './providers/snippet_completion_item_provider';
import { SDKUtil } from './sdk/util';
import { DartWorkspaceContext } from '../shared/interfaces';
import { EmittingLogger, RingLog } from '../shared/logging';
import { Analytics } from './analytics';

export const DART_MODE = { language: "dart", scheme: "file" };
const logger = new EmittingLogger();

// Keep a running in-memory buffer of last 200 log events we can give to the
// user when something crashed even if they don't have disk-logging enabled.
export const ringLog: RingLog = new RingLog(200);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const dartCapabilites = DartCapabilities.empty;
	const sdkUtil = new SDKUtil(logger);
	const workspaceContextUnverified = await sdkUtil.scanWorkspace();
	let analytics = new Analytics(logger, workspaceContextUnverified);
	if (!workspaceContextUnverified.sdks.dart || (workspaceContextUnverified.hasAnyFlutterProjects && !workspaceContextUnverified.sdks.flutter)) {
		return sdkUtil.handleMissingSDKs(context, analytics, workspaceContextUnverified);
	}
	const workspaceContext = workspaceContextUnverified as DartWorkspaceContext;
	const sdks = workspaceContext.sdks;
	function shouldUseLSP(): boolean {
		if (sdks.dartVersion) {
			dartCapabilites.version = sdks.dartVersion;
			analytics.sdkVersion = sdks.dartVersion;
		}
		if (!vscodeCapabilities.supportsLatestLSPClient || !dartCapabilites.canDefaultLSP) {
			return false;
		}
		if (process.env.DART_CODE_FORCE_LSP === "true") {
			return true;
		}
		if (process.env.DART_CDDE_FORCE_LSP === "false") {
			return false;
		}
		const isVirtualWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.every((f) => f.uri.scheme !== "file");
		if (isVirtualWorkspace) {
			return true;
		}
		return true;
	}
	const useLSP = shouldUseLSP();
	const fileName = "snippets/flutter.code-snippets";
	const provider = new SnippetCompletionItemProvider(useLSP, dartCapabilites, fileName, (uri) => util.isInsideFlutterProject(uri));
	const disposable = vscode.languages.registerCompletionItemProvider(DART_MODE, provider);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
