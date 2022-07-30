import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export const isWin = process.platform.startsWith("win");
export const extensionPath = vscode.extensions.getExtension("yanshouwang.clover-vscode")!.extensionPath;

export function readJSON(file: string): any {
	return JSON.parse(fs.readFileSync(file).toString());
}

export function createMarkdownString(doc: string) {
	const md = new vscode.MarkdownString(doc);
	md.supportHtml = true;
	return md;
}

export function fsPath(uri: { fsPath: string } | string, { useRealCasing = false }: { useRealCasing?: boolean; } = {}) {
	let newPath = typeof uri === "string" ? uri : uri.fsPath;

	if (useRealCasing) {
		const realPath = fs.existsSync(newPath) && fs.realpathSync.native(newPath);
		// Since realpathSync.native will resolve symlinks, only do anything if the paths differ
		// _only_ by case.
		// when there was no symlink (eg. the lowercase version of both paths match).
		if (realPath && realPath.toLowerCase() === newPath.toLowerCase() && realPath !== newPath) {
			console.warn(`Rewriting path:\n  ${newPath}\nto:\n  ${realPath} because the casing appears munged`);
			newPath = realPath;
		}
	}

	newPath = forceWindowsDriveLetterToUppercase(newPath);

	return newPath;
}

export function forceWindowsDriveLetterToUppercase<T extends string | undefined>(p: T): string | (undefined extends T ? undefined : never) {
	if (typeof p !== "string") { return undefined as (undefined extends T ? undefined : never); }

	if (p && isWin && path.isAbsolute(p) && p.startsWith(p.charAt(0).toLowerCase())) { return p.substring(0, 1).toUpperCase() + p.substring(1); }

	return p;
}

export function hasPackageMapFile(folder: string): boolean {
	return fs.existsSync(path.join(folder, ".dart_tool", "package_config.json")) || fs.existsSync(path.join(folder, ".packages"));
}

export function hasPubspec(folder: string): boolean {
	return fs.existsSync(path.join(folder, "pubspec.yaml"));
}

export function locateBestProjectRoot(folder: string): string | undefined {
	if (!folder || (!withinWorkspace(folder) && vscode.workspace.workspaceFolders?.length)) {
		return undefined;
	}

	let dir = folder;
	while (dir !== path.dirname(dir)) {
		if (hasPubspec(dir) || hasPackageMapFile(dir)) {
			return dir;
		}
		dir = path.dirname(dir);
	}

	return undefined;
}

export function projectReferencesFlutterSdk(folder?: string): boolean {
	if (folder && hasPubspec(folder)) {
		return pubspecContentReferencesFlutterSdk(fs.readFileSync(path.join(folder, "pubspec.yaml")).toString());
	}
	return false;
}

export function pubspecContentReferencesFlutterSdk(content: string): boolean {
	const regex = new RegExp("sdk\\s*:\\s*[\"']?flutter[\"']?", "i");
	return regex.test(content);
}

export function isFlutterProjectFolder(folder?: string): boolean {
	return projectReferencesFlutterSdk(folder);
}

export function isDartWorkspaceFolder(folder?: vscode.WorkspaceFolder): boolean {
	if (!folder || folder.uri.scheme !== "file") { return false; }

	// Currently we don't have good logic to know what's a Dart folder.
	// We could require a pubspec, but it's valid to just write scripts without them.
	// For now, nothing calls this that will do bad things if the folder isn't a Dart
	// project so we can review amend this in future if required.
	return true;
}

export function isFlutterWorkspaceFolder(folder?: vscode.WorkspaceFolder): boolean {
	return !!(folder && isDartWorkspaceFolder(folder) && isFlutterProjectFolder(fsPath(folder.uri)));
}

export function withinWorkspace(file: string) {
	return !!vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file));
}

export function withinFlutterProject(uri?: vscode.Uri): boolean {
	if (!uri) { return false; }

	const projectRoot = locateBestProjectRoot(fsPath(uri));
	if (projectRoot) { return isFlutterProjectFolder(projectRoot); }
	else { return isFlutterWorkspaceFolder(vscode.workspace.getWorkspaceFolder(uri)); }
}
