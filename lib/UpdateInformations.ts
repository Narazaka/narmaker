const crlf = "\x0d\x0a";

export interface UpdateInformation {
    path: string;
    size: number;
    hash: string;
}

export class UpdateInformations extends Array<UpdateInformation> {
    updatesTxt() {
        return this.map((update) => `file,${update.path} ${update.hash} size=${update.size} ${crlf}`).join("");
    }

    updates2dau() {
        return this.map((update) => `${update.path} ${update.hash} size=${update.size} ${crlf}`).join("");
    }
}
