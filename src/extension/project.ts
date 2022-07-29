import * as path from "path";
import { workspace } from "vscode";
import { hasPackageMapFile, hasPubspec } from "../shared/util/fs";
import { isWithinWorkspace } from "./util";

export const UPGRADE_TO_WORKSPACE_FOLDERS = "Mark Projects as Workspace Folders";

export function locateBestProjectRoot(folder: string): string | undefined {
    if (!folder || (!isWithinWorkspace(folder) && workspace.workspaceFolders?.length)) {
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