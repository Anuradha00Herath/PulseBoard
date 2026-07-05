const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
}

export function validateSignupInput({ email, password } = {}) {
  const errors = [];
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    errors.push("A valid email is required.");
  }
  if (typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  return { errors, email: normalizedEmail };
}

export function validateLoginInput({ email, password } = {}) {
  const errors = [];
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    errors.push("Email is required.");
  }
  if (typeof password !== "string" || password.length === 0) {
    errors.push("Password is required.");
  }

  return { errors, email: normalizedEmail };
}
