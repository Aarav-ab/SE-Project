import jwt from "jsonwebtoken";
import { authCookieName } from "./auth.js";
import { pool } from "./db.js";

const tokenSecret = process.env.JWT_SECRET;

export async function requireAuth(req, res, next) {
  const token = req.cookies[authCookieName];
  if (!token) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  let claims;
  try {
    claims = jwt.verify(token, tokenSecret, { issuer: "nagrikconnect" });
  } catch {
    res.status(401).json({ error: "Your session has expired. Please sign in again." });
    return;
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, role FROM users WHERE id = $1",
      [claims.sub],
    );
    if (!rows.length) {
      res.status(401).json({ error: "Your session is no longer valid." });
      return;
    }
    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Administrator access is required." });
    return;
  }
  next();
}
