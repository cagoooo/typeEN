import CryptoJS from 'crypto-js';

// The secret key for client-side encryption.
// Note: This is an obfuscation technique. In a real-world scenario with high stakes,
// a determined user could still find this key in the bundled code. However, it's
// sufficient to prevent 99% of casual tampering via the browser console/DevTools.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'NeonType_S3cr3t_K3y_2026';

// Bump whenever the shape of persisted data changes in a breaking way.
// Migrations in `MIGRATIONS` run in order to upgrade old payloads.
export const CURRENT_SCHEMA_VERSION = 2;

// Each migration takes the object at the *previous* version and returns the
// object shape at the *next* version. They run sequentially so old clients can
// catch up through multiple hops without writing bespoke branches per version.
const MIGRATIONS = {
    // v0 → v1: guarantee combo / completed fields exist for every mode.
    // Previously only beginnerTime / normalTime / endlessTime / wordTime were
    // initialised, so migrating users opening the app after the v1.1.10
    // leaderboard fix would otherwise be missing these keys.
    1: (data) => {
        if (!data || typeof data !== 'object') return data;
        const defaults = {
            beginnerCombo: 0, beginnerCompleted: 0,
            normalCombo: 0, normalCompleted: 0,
            endlessCombo: 0, endlessCompleted: 0,
            wordCombo: 0, wordCompleted: 0
        };
        // Only fill in missing keys — never overwrite real data.
        return { ...defaults, ...data };
    },
    // v1 → v2: reserve an `accuracy` slot for the upcoming per-mode accuracy
    // tracking so the UI can render the column without crashing on legacy data.
    2: (data) => {
        if (!data || typeof data !== 'object') return data;
        const defaults = {
            beginnerAccuracy: 0,
            normalAccuracy: 0,
            wordAccuracy: 0,
            endlessAccuracy: 0
        };
        return { ...defaults, ...data };
    }
};

// Run every migration from (fromVersion + 1) up to the current version.
const migrate = (data, fromVersion) => {
    let current = data;
    for (let v = fromVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
        const fn = MIGRATIONS[v];
        if (typeof fn === 'function') {
            try {
                current = fn(current);
            } catch (err) {
                console.warn(`Migration to v${v} failed, keeping previous shape:`, err);
            }
        }
    }
    return current;
};

export const encryptData = (data) => {
    try {
        // Envelope the payload so reads can detect schema drift. We wrap only
        // plain objects — primitive payloads (rare) pass straight through.
        const payload = (data && typeof data === 'object' && !Array.isArray(data))
            ? { __v: CURRENT_SCHEMA_VERSION, data }
            : data;
        const jsonString = JSON.stringify(payload);
        return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
};

export const decryptData = (ciphertext) => {
    try {
        if (!ciphertext) return null;

        let parsed = null;

        // Check if it's already plain JSON (legacy support)
        if (ciphertext.startsWith('{') || ciphertext.startsWith('[')) {
            try {
                parsed = JSON.parse(ciphertext);
            } catch (e) {
                // Not plain JSON, fall through to AES decrypt below.
            }
        }

        if (parsed === null) {
            const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) return null;
            parsed = JSON.parse(decryptedString);
        }

        // Unwrap the schema envelope if present, then run migrations.
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && '__v' in parsed && 'data' in parsed) {
            const stored = Number(parsed.__v) || 0;
            if (stored < CURRENT_SCHEMA_VERSION) {
                return migrate(parsed.data, stored);
            }
            return parsed.data;
        }

        // Legacy payload with no envelope — assume v0 and migrate forward.
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return migrate(parsed, 0);
        }

        return parsed;
    } catch (error) {
        console.error('Decryption failed, returning null to reset data:', error);
        return null;
    }
};
