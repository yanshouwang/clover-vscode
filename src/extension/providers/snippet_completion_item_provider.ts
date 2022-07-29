import * as path from "path";
import * as vscode from "vscode";
import { DartCapabilities } from "../../shared/capabilities/dart";
import { createMarkdownString, extensionPath, readJSON } from "../../shared/vscode/extension_util";

export class SnippetCompletionItemProvider implements vscode.CompletionItemProvider {
    private readonly completions = new vscode.CompletionList();

    constructor(private readonly useLSP: boolean, private readonly dartCapabilities: DartCapabilities, fileName: string, private readonly verifyUri: (uri: vscode.Uri) => boolean) {
        const file = path.join(extensionPath, fileName);
        const snippets = readJSON(file) as { [key: string]: { prefix: string, description: string | undefined, body: string | string[] } };
        const labels = snippets.keys;
        for (const label in labels) {
            const snippet = snippets[label];
            const completion = new vscode.CompletionItem(label, vscode.CompletionItemKind.Snippet);
            completion.filterText = snippet.prefix;
            const value = Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body;
            completion.insertText = new vscode.SnippetString(value);
            completion.detail = snippet.description;
            completion.documentation = createMarkdownString("").appendCodeblock(completion.insertText.value);
            completion.sortText = "zzzzzzzzzzzzzzzzzzzzzz";
            this.completions.items.push(completion);
        }
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionList<vscode.CompletionItem> | vscode.CompletionItem[]> {
        if (this.dartCapabilities.supportsServerSnippets && this.useLSP) {
            return;
        }
        const line = document.lineAt(position.line).text.slice(0, position.character);
        if (!this.verifyLine(line)) {
            return;
        }
        if (!this.verifyUri(document.uri)) {
            return;
        }
        return this.completions;
    }

    private verifyLine(line: string): boolean {
        line = line.trim();
        // Don't provide completions after comment markers. This isn't perfect since it'll
        // suppress them for ex if // appears inside strings, but it's a reasonable
        // approximation given we don't have a reliable way to tell that.
        if (line.indexOf("//") !== -1) {
            return false;
        }
        // Otherwise, allow through.
        return true;
    }
}