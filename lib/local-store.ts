/**
 * Client-side credential store for PWA auto-login and session refresh.
 * Uses IndexedDB with AES-GCM encryption via Web Crypto API.
 */

const DB_NAME = "proton_relink_vault";
const STORE_NAME = "auth";
const RECORD_KEY = "active_credentials";
const LOCAL_STORAGE_KEY = "pl_vault_fallback";

// Derive or get a persistent device encryption key
async function getDeviceKey(): Promise<CryptoKey> {
  const keyMaterial = "pl_relink_vault_salt_v1";
  const enc = new TextEncoder();
  const rawKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyMaterial.padEnd(32, "#")),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return rawKey;
}

async function encryptData(text: string): Promise<{ iv: string; data: string }> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(text)
  );

  return {
    iv: Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
    data: Array.from(new Uint8Array(encrypted)).map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

async function decryptData(bundle: { iv: string; data: string }): Promise<string | null> {
  try {
    const key = await getDeviceKey();
    const iv = new Uint8Array(bundle.iv.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
    const data = new Uint8Array(bundle.data.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

// Open IndexedDB
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not available"));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export type StoredCredentials = {
  phone: string;
  password: string;
  savedAt: number;
};

/**
 * Save encrypted credentials to IndexedDB with localStorage fallback.
 */
export async function saveStoredCredentials(phone: string, password: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const encryptedPassword = await encryptData(password);
    const payload = {
      phone,
      encryptedPassword,
      savedAt: Date.now(),
    };

    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(payload, RECORD_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage if IndexedDB fails or is restricted
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn("[CredentialStore] Failed to save credentials:", err);
  }
}

/**
 * Retrieve and decrypt credentials from IndexedDB or localStorage.
 */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
  if (typeof window === "undefined") return null;

  try {
    let record: { phone: string; encryptedPassword: { iv: string; data: string }; savedAt: number } | null = null;

    try {
      const db = await openDb();
      record = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(RECORD_KEY);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) record = JSON.parse(raw);
    }

    if (!record || !record.phone || !record.encryptedPassword) {
      return null;
    }

    const password = await decryptData(record.encryptedPassword);
    if (!password) return null;

    return {
      phone: record.phone,
      password,
      savedAt: record.savedAt,
    };
  } catch (err) {
    console.warn("[CredentialStore] Failed to retrieve credentials:", err);
    return null;
  }
}

/**
 * Clear stored credentials from both IndexedDB and localStorage.
 */
export async function clearStoredCredentials(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(RECORD_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* ignore */
  }

  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Automatically re-authenticates with Proton using the stored credentials.
 * Returns true if session was refreshed, false if failed.
 */
export async function performAutoRelogin(): Promise<boolean> {
  try {
    const creds = await getStoredCredentials();
    if (!creds || !creds.phone || !creds.password) return false;

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: creds.phone, password: creds.password }),
    });

    if (response.ok) {
      const data = await response.json();
      return Boolean(data.ok);
    }
    return false;
  } catch {
    return false;
  }
}
