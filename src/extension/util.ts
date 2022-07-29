import * as fs from "fs";
import * as semver from "semver";
import { extensions, MarkdownString } from "vscode";

export const extensionPath = extensions.getExtension("yanshouwang.clover")!.extensionPath;

export function versionIsAtLeast(inputVersion: string, requiredVersion: string): boolean {
    return semver.gte(inputVersion, requiredVersion);
}

export function readJSON(file: string): any {
    const source = fs.readFileSync(file).toString();
    return JSON.parse(source);
}

export function createMarkdownString(doc: string) {
    const md = new MarkdownString(doc);
    md.supportHtml = true;
    return md;
}