const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const PIN_HASH_ROUNDS = Number.parseInt(process.env.PIN_HASH_ROUNDS || "12", 10);

const normalizeCardNumber = (cardNumber = "") => String(cardNumber).replace(/\D/g, "");

const getDerivedKey = (secret) => crypto.createHash("sha256").update(String(secret)).digest();

const getCardEncryptionSecret = () => {
  return (
    process.env.CARD_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "zenopay-dev-card-encryption-key-change-me"
  );
};

const getCardHashSecret = () => {
  return (
    process.env.CARD_HASH_KEY ||
    process.env.SESSION_SECRET ||
    "zenopay-dev-card-hash-key-change-me"
  );
};

const maskCardNumber = (cardNumber = "") => {
  const normalized = normalizeCardNumber(cardNumber);
  if (!normalized) return "**** **** **** ****";
  const last4 = normalized.slice(-4).padStart(4, "*");
  return `**** **** **** ${last4}`;
};

const createCardFingerprint = (cardNumber = "") => {
  const normalized = normalizeCardNumber(cardNumber);
  if (!normalized) return "";

  return crypto
    .createHmac("sha256", getCardHashSecret())
    .update(normalized)
    .digest("hex");
};

const encryptCardNumber = (cardNumber = "") => {
  const normalized = normalizeCardNumber(cardNumber);
  if (!normalized) return "";

  const key = getDerivedKey(getCardEncryptionSecret());
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
};

const hashPin = async (pin = "") => {
  if (!String(pin).trim()) return "";
  return bcrypt.hash(String(pin).trim(), PIN_HASH_ROUNDS);
};

const comparePin = async (pin = "", pinHash = "") => {
  if (!pinHash || !String(pin).trim()) return false;
  return bcrypt.compare(String(pin).trim(), pinHash);
};

module.exports = {
  normalizeCardNumber,
  maskCardNumber,
  createCardFingerprint,
  encryptCardNumber,
  hashPin,
  comparePin,
};
