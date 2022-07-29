// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { utils } from 'mocha';
import * as vscode from 'vscode';
import { DartCapabilities } from './capabilities/dart_capabilities';
import { vscodeCapabilities } from './capabilities/vscode_capabilities';
import { SnippetCompletionItemProvider } from './providers/snippet_completion_item_provider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const selector = { language: "dart", scheme: "file" };
	const dartCapabilites = DartCapabilities.empty;
	const workspaceContextUnverified = await util.scanWorkspace();
	let analytics = new Analytics(logger, workspaceContextUnverified);
	if (!workspaceContextUnverified.sdks.dart || (workspaceContextUnverified.hasAnyFlutterProjects && !workspaceContextUnverified.sdks.flutter)) {
		return util.handleMissingSDKs(context, analytics, workspaceContextUnverified);
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
	const shouldRenderer = (uri: vscode.Uri) => utils.isInsideFlutterProject(uri);
	const provider = new SnippetCompletionItemProvider(useLSP, dartCapabilites, fileName, shouldRenderer);
	const disposable = vscode.languages.registerCompletionItemProvider(selector, provider);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
