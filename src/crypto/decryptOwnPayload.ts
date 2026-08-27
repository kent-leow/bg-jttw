import { base64ToBuffer, type EncryptedEnvelope } from "./encryptForPlayer";

export async function decryptOwnPayload<T = unknown>(
  privateKey: CryptoKey,
  envelope: EncryptedEnvelope,
): Promise<T> {
  try {
    const rawAesKey = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      base64ToBuffer(envelope.encryptedKey),
    );
    const aesKey = await crypto.subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const iv = new Uint8Array(base64ToBuffer(envelope.iv));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      base64ToBuffer(envelope.ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    throw new Error("Failed to decrypt payload: it was not encrypted for this device's key pair.");
  }
}
