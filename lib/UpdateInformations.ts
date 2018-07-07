const crlf = "\x0d\x0a";

export interface UpdateInformation {
    path: string;
    size: number;
    hash: string;
}

export class UpdateInformations extends Array<UpdateInformation> {
    updatesTxt() {
        return this.map((update) => `file,${update.path}\x01${update.hash}\x01size=${update.size}\x01${crlf}`).join("");
    }

    updates2dau() {
        return this.map((update) => `${update.path}\x01${update.hash}\x01size=${update.size}\x01${crlf}`).join("");
    }
}
