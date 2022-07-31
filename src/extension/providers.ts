import * as vscode from "vscode";
import * as util from "./util";

export class SnippetCompletionItemProvider implements vscode.CompletionItemProvider {
    private readonly completions = new vscode.CompletionList();

    constructor(file: string, private readonly verifyUri: (uri: vscode.Uri) => boolean) {
        const snippets = util.readJSON(file) as { [key: string]: { prefix: string, description: string | undefined, body: string | string[] } };
        const labels = Object.keys(snippets);
        for (const label of labels) {
            const snippet = snippets[label];
            const completion = new vscode.CompletionItem(label, vscode.CompletionItemKind.Snippet);
            completion.filterText = snippet.prefix;
            const value = Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body;
            completion.insertText = new vscode.SnippetString(value);
            completion.detail = snippet.description;
            completion.documentation = util.createMarkdownString("").appendCodeblock(completion.insertText.value);
            completion.sortText = "zzzzzzzzzzzzzzzzzzzzzz";
            this.completions.items.push(completion);
        }
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionList<vscode.CompletionItem> | vscode.CompletionItem[]> {
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