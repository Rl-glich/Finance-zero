/**
 * End-to-End Encryption (E2EE) Engine for KuroFinance
 * Utilizes Web Crypto API (SubtleCrypto) with AES-GCM 256-bit
 * and PBKDF2 key derivation from a user master key / PIN.
 * Guarantees zero plaintext exposure of banking credentials and sensitive account balances.
 */

const SALT_STORAGE_KEY = 'kurofinance_crypto_salt';
const VAULT_STATUS_KEY = 'kurofinance_vault_active';

// Generate or retrieve persistent salt for PBKDF2
export function getOrCreateSalt(): Uint8Array {
  const existing = localStorage.getItem(SALT_STORAGE_KEY);
  if (existing) {
    const raw = atob(existing);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }
    return bytes;
  }
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  let str = '';
  for (let i = 0; i < salt.length; i++) {
    str += String.fromCharCode(salt[i]);
  }
  localStorage.setItem(SALT_STORAGE_KEY, btoa(str));
  return salt;
}

// Derive AES-GCM 256-bit CryptoKey from passphrase/PIN
export async function deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = getOrCreateSalt();

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt plaintext JSON/string using AES-GCM
export async function encryptData(data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(data)
  );

  const ciphertextArray = new Uint8Array(encryptedBuffer);
  let cipherStr = '';
  for (let i = 0; i < ciphertextArray.length; i++) {
    cipherStr += String.fromCharCode(ciphertextArray[i]);
  }

  let ivStr = '';
  for (let i = 0; i < iv.length; i++) {
    ivStr += String.fromCharCode(iv[i]);
  }

  return {
    ciphertext: btoa(cipherStr),
    iv: btoa(ivStr),
  };
}

// Decrypt AES-GCM ciphertext
export async function decryptData(ciphertextB64: string, ivB64: string, key: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const rawCipher = atob(ciphertextB64);
  const cipherBytes = new Uint8Array(rawCipher.length);
  for (let i = 0; i < rawCipher.length; i++) {
    cipherBytes[i] = rawCipher.charCodeAt(i);
  }

  const rawIv = atob(ivB64);
  const ivBytes = new Uint8Array(rawIv.length);
  for (let i = 0; i < rawIv.length; i++) {
    ivBytes[i] = rawIv.charCodeAt(i);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer },
    key,
    cipherBytes.buffer as ArrayBuffer
  );

  return dec.decode(decryptedBuffer);
}

export function isVaultActive(): boolean {
  return localStorage.getItem(VAULT_STATUS_KEY) === 'true';
}

export function setVaultActive(active: boolean): void {
  localStorage.setItem(VAULT_STATUS_KEY, active ? 'true' : 'false');
}
