import CryptoJS from "crypto-js";

export const CryptoUtil = {
    hashPassword(password: string): string {
        return CryptoJS.SHA256(password).toString();
    },

    verifyPassword(password: string, hash: string): boolean {
        return CryptoJS.SHA256(password).toString() === hash;
    },
};
