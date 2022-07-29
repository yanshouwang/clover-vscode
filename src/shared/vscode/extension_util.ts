import * as fs from "fs";
import * as path from "path";
import { extensions, MarkdownString, Uri } from "vscode";
import { dartCodeExtensionIdentifier, flutterExtensionIdentifier } from "../constants";
import * as dartDocs from "../util/dart_docs";

export const extensionPath = extensions.getExtension(dartCodeExtensionIdentifier)!.extensionPath;
export const extensionVersion = getExtensionVersion();
export const vscodeVersionConstraint = getVSCodeVersionConstraint();
export const isPreReleaseExtension = checkIsPreReleaseExtension();
export const isDevExtension = checkIsDevExtension();
export const hasFlutterExtension = checkHasFlutterExtension();
export const docsIconPathFormat = Uri.file(path.join(extensionPath, "media/doc-icons/")).toString() + "$1%402x.png";

export function readJSON(file: string): any {
    return JSON.parse(fs.readFileSync(file).toString());
}

function getExtensionVersion(): string {
    const packageJson = readJSON(path.join(extensionPath, "package.json"));
    return packageJson.version;
}

function getVSCodeVersionConstraint(): string {
    const packageJson = readJSON(path.join(extensionPath, "package.json"));
    return packageJson.engines.vscode;
}

function checkIsDevExtension() {
    return extensionVersion.endsWith("-dev");
}

function checkIsPreReleaseExtension() {
    const segments = extensionVersion.split(".");
    const minSegment = parseInt(segments[1]);
    return minSegment % 2 === 1;
}

export function checkHasFlutterExtension() {
    return extensions.getExtension(flutterExtensionIdentifier) !== undefined;
}

export function cleanDartDoc(doc: string | undefined) {
    return dartDocs.cleanDartDoc(doc, docsIconPathFormat);
}

export function createMarkdownString(doc: string) {
    const md = new MarkdownString(doc);
    md.supportHtml = true;
    return md;
}