export interface UpdateInformation {
    path: string;
    size: number;
    hash: string;
}
export declare class UpdateInformations extends Array<UpdateInformation> {
    updatesTxt(): string;
    updates2dau(): string;
}
