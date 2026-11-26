import { randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { pool } from "./db.js";

export const authRouter = express.Router();
export const authCookieName = "nagrikconnect_session";
const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const tokenSecret = process.env.JWT_SECRET;
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL ??
  `http://localhost:${process.env.PORT ?? 3001}/api/auth/google/callback`;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

if (!tokenSecret || tokenSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}

const passwordSchema = z.string().min(10).max(128)
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be 72 bytes or fewer.");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be 72 bytes or fewer."),
});

function issueSession(res, user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    tokenSecret,
    { expiresIn: "7d", issuer: "nagrikconnect" },
  );
  res.cookie(authCookieName, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function validateBody(schema, body) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message ?? "Invalid request.");
    error.status = 400;
    throw error;
  }
  return parsed.data;
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = validateBody(registerSchema, req.body);
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id, name, email, role`,
      [name, email, passwordHash],
    );
    issueSession(res, rows[0]);
    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = validateBody(loginSchema, req.body);
    const { rows } = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = LOWER($1)",
      [email],
    );
    const user = rows[0];
    if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: "Email or password is incorrect." });
      return;
    }
    issueSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(503).json({ error: "Google sign-in is not configured on this server." });
    return;
  }
  const state = randomBytes(32).toString("hex");
  res.cookie("nagrikconnect_oauth_state", state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: googleCallbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

authRouter.get("/google/callback", async (req, res, next) => {
  try {
    const state = req.cookies.nagrikconnect_oauth_state;
    const suppliedState = req.query.state;
    res.clearCookie("nagrikconnect_oauth_state", cookieOptions);
    const validStateFormat =
      typeof state === "string" &&
      /^[0-9a-f]{64}$/.test(state) &&
      typeof suppliedState === "string" &&
      /^[0-9a-f]{64}$/.test(suppliedState);
    if (
      !validStateFormat ||
      !timingSafeEqual(Buffer.from(state), Buffer.from(suppliedState))
    ) {
      res.status(400).send("Google sign-in could not be verified. Please try again.");
      return;
    }
    if (typeof req.query.code !== "string") {
      res.status(400).send("Google sign-in was not completed.");
      return;
    }
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10000),
      body: new URLSearchParams({
        code: req.query.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: googleCallbackUrl,
        grant_type: "authorization_code",
      }),
    });
    if (!response.ok) {
      throw new Error("Google token exchange failed.");
    }
    const tokens = await response.json();
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || !profile.email_verified) {
      res.status(401).send("Use a verified Google email address to sign in.");
      return;
    }

    const client = await pool.connect();
    let user;
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT id, name, email, role, google_id FROM users
         WHERE google_id = $1 OR email = LOWER($2)
         FOR UPDATE`,
        [profile.sub, profile.email],
      );
      if (rows.length > 1) {
        throw Object.assign(new Error("This Google account conflicts with existing account links."), { status: 409 });
      }
      if (rows.length) {
        user = rows[0];
        if (user.google_id && user.google_id !== profile.sub) {
          throw Object.assign(new Error("This email is already linked to another Google account."), { status: 409 });
        }
        await client.query(
          "UPDATE users SET google_id = $1 WHERE id = $2 AND google_id IS NULL",
          [profile.sub, user.id],
        );
      } else {
        const inserted = await client.query(
          `INSERT INTO users (name, email, google_id)
           VALUES ($1, LOWER($2), $3)
           RETURNING id, name, email, role`,
          [profile.name || profile.email, profile.email, profile.sub],
        );
        user = inserted.rows[0];
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    issueSession(res, user);
    res.redirect(frontendUrl);
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies[authCookieName];
    if (!token) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }
    const claims = jwt.verify(token, tokenSecret, { issuer: "nagrikconnect" });
    const { rows } = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [claims.sub],
    );
    if (!rows.length) {
      res.clearCookie(authCookieName, cookieOptions);
      res.status(401).json({ error: "Not signed in." });
      return;
    }
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.clearCookie(authCookieName, cookieOptions);
      res.status(401).json({ error: "Your session has expired. Please sign in again." });
      return;
    }
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(authCookieName, cookieOptions);
  res.status(204).end();
});
