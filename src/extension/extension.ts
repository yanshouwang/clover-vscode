// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from "path";
import * as util from "./util";
import { SnippetCompletionItemProvider } from './providers';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const selector = { language: "dart", scheme: "file" };
	const file = path.join(context.extensionPath, "snippets", "flutter.code-snippets");
	const provider = new SnippetCompletionItemProvider(file, (uri) => util.withinFlutterProject(uri));
	const disposable = vscode.languages.registerCompletionItemProvider(selector, provider);
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
