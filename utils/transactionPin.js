const bcrypt = require("bcryptjs");

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 30;

const isLocked = (user) => {
  if (!user?.pinLockedUntil) return false;
  return new Date(user.pinLockedUntil).getTime() > Date.now();
};

const getLockMessage = (user) => {
  if (!isLocked(user)) return null;
  const minutesLeft = Math.max(
    1,
    Math.ceil((new Date(user.pinLockedUntil).getTime() - Date.now()) / (1000 * 60))
  );
  return `PIN locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""}.`;
};

const verifyTransactionPinForUser = async (user, pin) => {
  if (!user) {
    return { valid: false, attemptsLeft: 0, message: "User not found" };
  }

  if (!user.transactionPin) {
    return { valid: false, attemptsLeft: MAX_ATTEMPTS, message: "Transaction PIN not set" };
  }

  if (isLocked(user)) {
    return {
      valid: false,
      attemptsLeft: 0,
      lockedUntil: user.pinLockedUntil,
      message: getLockMessage(user),
    };
  }

  const pinValue = String(pin || "").trim();
  const isValid = await bcrypt.compare(pinValue, user.transactionPin);

  if (isValid) {
    user.pinAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();
    return { valid: true, attemptsLeft: MAX_ATTEMPTS };
  }

  const nextAttempts = Number(user.pinAttempts || 0) + 1;
  user.pinAttempts = nextAttempts;

  if (nextAttempts >= MAX_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
    user.pinLockedUntil = lockUntil;
    await user.save();
    return {
      valid: false,
      attemptsLeft: 0,
      lockedUntil: lockUntil,
      message: `Too many incorrect attempts. PIN locked for ${LOCK_MINUTES} minutes.`,
    };
  }

  await user.save();
  return {
    valid: false,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - nextAttempts),
    message: "Invalid transaction PIN",
  };
};

module.exports = {
  verifyTransactionPinForUser,
  MAX_ATTEMPTS,
  LOCK_MINUTES,
};
