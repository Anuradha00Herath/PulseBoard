import { verifyToken } from "../auth/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ errors: ["Missing or malformed Authorization header."] });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ errors: ["Invalid or expired token."] });
  }
}
