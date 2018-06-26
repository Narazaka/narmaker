"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crlf = "\x0d\x0a";
class UpdateInformations extends Array {
    updatesTxt() {
        return this.map((update) => `file,${update.path} ${update.hash} size=${update.size} ${crlf}`).join("");
    }
    updates2dau() {
        return this.map((update) => `${update.path} ${update.hash} size=${update.size} ${crlf}`).join("");
    }
}
exports.UpdateInformations = UpdateInformations;
