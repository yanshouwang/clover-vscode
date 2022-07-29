import * as path from "path";
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, Position, ProviderResult, SnippetString, TextDocument, Uri } from "vscode";
import { DartCapabilities } from "../capabilities/dart_capabilities";
import { createMarkdownString, extensionPath, readJSON } from "../util";

export class SnippetCompletionItemProvider implements CompletionItemProvider {
    private completions = new CompletionList();
    private shouldRender: (uri: Uri) => boolean;

    constructor(private readonly useLSP: boolean, private readonly dartCapabilities: DartCapabilities, fileName: string, shouldRender: (uri: Uri) => boolean) {
        this.shouldRender = shouldRender;
        const file = path.join(extensionPath, fileName);
        const snippets = readJSON(file) as { [key: string]: { prefix: string, description: string | undefined, body: string | string[] } };
        const labels = snippets.keys;
        for (const label in labels) {
            const snippet = snippets[label];
            const completion = new CompletionItem(label, CompletionItemKind.Snippet);
            completion.filterText = snippet.prefix;
            const value = Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body;
            completion.insertText = new SnippetString(value);
            completion.detail = snippet.description;
            completion.documentation = createMarkdownString("").appendCodeblock(completion.insertText.value);
            completion.sortText = "zzzzzzzzzzzzzzzzzzzzzz";
            this.completions.items.push(completion);
        }
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
        if (this.dartCapabilities.supportsServerSnippets && this.useLSP) {
            return;
        }
        const line = document.lineAt(position.line).text.slice(0, position.character);
        if (!this.shouldAllowCompletion(line, context)) {
            return;
        }
        if (!this.shouldRender(document.uri)) {
            return;
        }
        return this.completions;
    }

    private shouldAllowCompletion(line: string, context: CompletionContext): boolean {
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