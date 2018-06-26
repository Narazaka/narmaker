import { FileSystemObject } from "fso";
import * as JSZip from "jszip";
import { UpdateInformations } from "./UpdateInformations";
export declare class NarMaker {
    static parseDeveloperOptions(content: string): {
        narIgnorePaths: string[];
        updatesIgnorePaths: string[];
    };
    static withDeveloperOptions(rootPath: string): Promise<NarMaker>;
    private static developerOptionRe;
    readonly rootPath: string;
    readonly narIgnorePaths: string[];
    readonly updatesIgnorePaths: string[];
    readonly root: FileSystemObject;
    constructor(rootPath: string, options?: {
        narIgnorePaths?: string[];
        updatesIgnorePaths?: string[];
    });
    makeNar(): Promise<JSZip>;
    makeNarFile(narPath: string): Promise<void>;
    makeUpdates(): Promise<UpdateInformations>;
    makeUpdatesFile(): Promise<void>;
}
