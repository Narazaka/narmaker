import * as crypto from "crypto";
import { ReadStream } from "fs";
import { FileSystemObject } from "fso";
import * as JSZip from "jszip";
import normalizePath = require("normalize-path");
import { UpdateInformations } from "./UpdateInformations";

const md5 = (readStream: ReadStream) => new Promise<string>((resolve, reject) => {
    const md5hash = crypto.createHash("md5");
    md5hash.setEncoding("hex");
    readStream.pipe(md5hash);
    readStream.on("end", () => resolve(md5hash.read() as string));
    readStream.on("error", reject);
});

export class NarMaker {
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

    private static developerOptionRe = /^(.+),(nonar|noupdate)(?:,(nonar|noupdate))?$/;

    readonly rootPath: string;
    readonly narIgnorePaths: string[];
    readonly updatesIgnorePaths: string[];
    readonly root: FileSystemObject;

    constructor(rootPath: string, options: {narIgnorePaths?: string[], updatesIgnorePaths?: string[]} = {}) {
        this.rootPath = rootPath;
        this.narIgnorePaths = options.narIgnorePaths || [];
        this.updatesIgnorePaths = options.updatesIgnorePaths || [];
        this.root = new FileSystemObject(this.rootPath);
    }

    async makeNar() {
        const children = await this.root.filteredChildrenAll(this.narIgnorePaths);

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
        const children = await this.root.filteredChildrenAll(this.updatesIgnorePaths);

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
}
