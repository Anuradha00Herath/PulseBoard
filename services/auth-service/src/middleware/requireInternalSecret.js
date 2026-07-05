export function requireInternalSecret(req, res, next) {
  const provided = req.headers["x-internal-secret"];
  if (!provided || provided !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ errors: ["Invalid internal secret."] });
  }
  next();
}
