import CryptoJS from 'crypto-js';

// The secret key for client-side encryption.
// Note: This is an obfuscation technique. In a real-world scenario with high stakes,
// a determined user could still find this key in the bundled code. However, it's 
// sufficient to prevent 99% of casual tampering via the browser console/DevTools.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'NeonType_S3cr3t_K3y_2026';

export const encryptData = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
};

export const decryptData = (ciphertext) => {
    try {
        if (!ciphertext) return null;

        // Check if it's already plain JSON (legacy support)
        if (ciphertext.startsWith('{') || ciphertext.startsWith('[')) {
            try {
                return JSON.parse(ciphertext);
            } catch (e) {
                // Ignore and try decrypting
            }
        }

        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedString) return null;
        return JSON.parse(decryptedString);
    } catch (error) {
        console.error('Decryption failed, returning null to reset data:', error);
        return null;
    }
};
