import { Router } from "express";
import { requireInternalSecret } from "../middleware/requireInternalSecret.js";
import { findApiKeyByHash } from "../models/apiKey.js";

export const internalRouter = Router();

internalRouter.use(requireInternalSecret);

// Cold-start fallback for ingestion-service when Redis has no entry for a key's
// hash (fresh deploy or cache flush) — see docs/sprint2-design.md #1. Not exposed
// publicly; only reachable with the shared INTERNAL_API_SECRET.
internalRouter.post("/api-keys/verify", async (req, res, next) => {
  try {
    const hash = req.body?.hash;
    if (typeof hash !== "string" || hash.length === 0) {
      return res.status(400).json({ errors: ["hash is required."] });
    }

    const apiKey = await findApiKeyByHash(hash);
    if (!apiKey) {
      return res.json({ valid: false });
    }

    res.json({ valid: true, keyId: apiKey.id, name: apiKey.name });
  } catch (err) {
    next(err);
  }
});
