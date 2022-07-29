import * as vs from "vscode";

export const isTheia = vs.env.appName?.includes("Theia") ?? false;
export const isCloudShell = vs.env.appName?.includes("Cloud Shell") ?? false;
export const isKnownCloudEditor = isTheia || isCloudShell;