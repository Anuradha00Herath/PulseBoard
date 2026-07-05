import { Router } from "express";
import { createUser, findUserByEmail } from "../models/user.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signToken } from "../auth/jwt.js";
import { validateSignupInput, validateLoginInput } from "../auth/validate.js";

const SELF_SERVICE_ROLES = ["viewer", "editor"];
const DEFAULT_ROLE = "editor";

function toPublicUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

export const authRouter = Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { errors, email } = validateSignupInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const requestedRole = req.body?.role;
    const role = SELF_SERVICE_ROLES.includes(requestedRole) ? requestedRole : DEFAULT_ROLE;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ errors: ["An account with this email already exists."] });
    }

    const passwordHash = await hashPassword(req.body.password);
    const user = await createUser({ email, passwordHash, role });
    const token = signToken(user);

    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { errors, email } = validateLoginInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(req.body.password, user.password_hash))) {
      return res.status(401).json({ errors: ["Invalid email or password."] });
    }

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});
