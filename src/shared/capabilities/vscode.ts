import * as vscode from "vscode";
import { versionIsAtLeast } from "../util";
import { isCloudShell, isKnownCloudEditor, isTheia } from "../vscode/cloud_util";

export class VSCodeCapabilities {
    public version: string;

    constructor(version: string) {
        this.version = version;
    }

    // This version should match the minimum the LSP client we're using supports.
    // https://github.com/microsoft/vscode-languageserver-node/blob/main/client/src/node/main.ts#L25
    get supportsLatestLSPClient() { return versionIsAtLeast(this.version, "1.67.0"); }
    // Theia doesn't currently support launching without a launch.json. This may need updating to also
    // check the version in future.
    get supportsDebugWithoutLaunchJSON() { return !isTheia; }
    // Cloud editors may have authentication issues trying to use embedded DevTools so just disable it.
    get supportsEmbeddedDevTools() { return !isKnownCloudEditor; }
    get supportsDevTools() { return !isCloudShell; } // Until DevTools can work without SSE, it will not work on Cloud Shell.
    get editorConfigFolder() { return isTheia ? ".theia" : ".vscode"; }
}

export const vscodeCapabilities = new VSCodeCapabilities(vscode.version);