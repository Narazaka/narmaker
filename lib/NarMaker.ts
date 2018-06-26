import * as crypto from "crypto";
import { ReadStream } from "fs";
import { FileSystemObject } from "fso";
import * as JSZip from "jszip";
import normalizePath = require("normalize-path");
import * as path from "path";
import { UpdateInformations } from "./UpdateInformations";

const md5 = (readStream: ReadStream) => new Promise<string>((resolve, reject) => {
    const md5hash = crypto.createHash("md5");
    md5hash.setEncoding("hex");
    readStream.pipe(md5hash);
    readStream.on("end", () => resolve(md5hash.read() as string));
    readStream.on("error", reject);
});

function toIgnorePathMap(ignorePaths?: string[]) {
    const map: {[path: string]: boolean} = {};
    for (const ignorePath of (ignorePaths || []).map(path.normalize)) {
        map[ignorePath] = true;
    }

    return map;
}

export class NarMaker {
    static globalIgnoreFileNames = [
        "desktop.ini",
        "thumbs.db",
        "folder.htt",
        "mscreate.dir",
        ".DS_Store",
        "_CATALOG.VIX",
        "profile",
    ];

    static globalIgnoreDirectoryNames = [
        "profile",
        "var",
        "__MACOSX",
        "XtraStuf.mac",
    ];

    static updatesAlwaysIgnorePaths = [
        "updates.txt",
        "updates2.dau",
    ];

    static parseDeveloperOptions(content: string) {
        const ignores: {[path: string]: {nonar?: boolean; noupdate?: boolean}} = {};
        for (const line of content.split(/\r?\n/)) {
            const result = NarMaker.developerOptionRe.exec(line);
            if (!result) continue;
            ignores[result[1]] = {[result[2]]: true, [result[3]]: true}; // 奇妙だがSSPの挙動に合わせる
        }

        const filePaths = Object.keys(ignores);

        return {
            narIgnorePaths: filePaths.filter((filePath) => ignores[filePath].nonar),
            updatesIgnorePaths: filePaths.filter((filePath) => ignores[filePath].noupdate),
        };
    }

    static async withDeveloperOptions(rootPath: string) {
        const developerOptions = new FileSystemObject(rootPath).join("developer_options.txt");

        return new NarMaker(
            rootPath,
            developerOptions.existsSync() ?
            NarMaker.parseDeveloperOptions(await developerOptions.readFile("utf8")) :
            undefined,
        );
    }

    private static developerOptionRe = /^(.+?),(nonar|noupdate)(?:,(nonar|noupdate))?$/;

    private readonly root: FileSystemObject;
    private readonly narIgnorePaths: {[path: string]: boolean};
    private readonly updatesIgnorePaths: {[path: string]: boolean};

    constructor(rootPath: string, options: {narIgnorePaths?: string[], updatesIgnorePaths?: string[]} = {}) {
        this.root = new FileSystemObject(rootPath);
        this.narIgnorePaths = toIgnorePathMap(options.narIgnorePaths);
        this.updatesIgnorePaths = toIgnorePathMap(
            (options.updatesIgnorePaths || []).concat(NarMaker.updatesAlwaysIgnorePaths),
        );
    }

    async makeNar() {
        const children = await this.filteredChildrenAll(this.narIgnorePaths);

        const zip = new JSZip();
        for (const child of children) {
            const stats = await child.stat();
            if (stats.isDirectory()) continue;
            zip.file(
                normalizePath(this.root.relative(child).path),
                child.createReadStream(),
                {date: stats.mtime},
            );
        }

        return zip;
    }

    async makeNarFile(narPath: string) {
        const zip = await this.makeNar();

        return new Promise<void>((resolve, reject) => {
            const zipStream = zip.generateNodeStream();
            const writeStream = new FileSystemObject(narPath).createWriteStream();
            zipStream.pipe(writeStream);
            zipStream.on("end", resolve);
            zipStream.on("error", reject);
        });
    }

    async makeUpdates() {
        const children = await this.filteredChildrenAll(this.updatesIgnorePaths);

        const updates = new UpdateInformations();
        for (const child of children) {
            const stats = await child.stat();
            if (stats.isDirectory()) continue;
            updates.push({
                hash: await md5(child.createReadStream()),
                path: normalizePath(this.root.relative(child).path),
                size: stats.size,
            });
        }

        return updates;
    }

    async makeUpdatesFile() {
        const updates = await this.makeUpdates();
        await this.root.join("updates.txt").writeFile(updates.updatesTxt());
        await this.root.join("updates2.dau").writeFile(updates.updates2dau());
    }

    protected filteredChildrenAll(ignorePaths: {[path: string]: boolean}) {
        return this.root.filteredChildrenAll(async (file) =>
            !ignorePaths[this.root.relative(file).path] && (
                await file.isDirectory() ?
                !NarMaker.globalIgnoreDirectoryNames.includes(file.basename().path) :
                !NarMaker.globalIgnoreFileNames.includes(file.basename().path)
            ),
        );
    }
}
