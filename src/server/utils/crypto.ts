import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.MAYA_ENCRYPTION_KEY || "default-secret-key-32-chars-long-!!"; // Must be 32 chars

export const encrypt = (text: string): string => {
  if (!text) return text;
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)), iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return encryptedText;
  
  const mask = "••••••••••••••••";
  if (encryptedText === mask) return ""; // Never return the mask as a key
  
  if (!encryptedText.startsWith("enc:")) return encryptedText; // Not encrypted
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 4) return encryptedText;
    
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = Buffer.from(parts[3], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)), iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error: any) {
    console.error("Decryption failed:", error.message);
    return "";
  }
};
