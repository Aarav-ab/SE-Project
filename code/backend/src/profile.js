import express from "express";
import { z } from "zod";
import { pool } from "./db.js";
import { requireAuth } from "./require-auth.js";

export const profileRouter = express.Router();
profileRouter.use(requireAuth);

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobileNumber: z.string().trim().max(20)
    .refine(
      (value) => value === "" || /^(?:\+?91[\s-]?)?[6-9]\d{9}$/.test(value),
      "Enter a valid Indian mobile number.",
    ),
  houseFlatNumber: z.string().trim().max(100),
  streetLocality: z.string().trim().max(200),
  areaWard: z.string().trim().max(200),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100),
  pinCode: z.string().trim().refine(
    (value) => value === "" || /^\d{6}$/.test(value),
    "PIN code must contain 6 digits.",
  ),
  landmark: z.string().trim().max(200),
  preferredLanguage: z.enum(["English", "Hindi"]),
}).strict();

const profileColumns = `
  id, name, email, mobile_number, house_flat_number, street_locality,
  area_ward, city, state, profile_pin_code, profile_landmark, preferred_language
`;

function toProfile(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    mobileNumber: row.mobile_number ?? "",
    houseFlatNumber: row.house_flat_number ?? "",
    streetLocality: row.street_locality ?? "",
    areaWard: row.area_ward ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    pinCode: row.profile_pin_code ?? "",
    landmark: row.profile_landmark ?? "",
    preferredLanguage: row.preferred_language,
  };
}

profileRouter.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${profileColumns} FROM users WHERE id = $1`,
      [req.user.id],
    );
    if (!rows.length) {
      res.status(404).json({ error: "Profile not found." });
      return;
    }
    res.json({ profile: toProfile(rows[0]) });
  } catch (error) {
    next(error);
  }
});

profileRouter.patch("/", async (req, res, next) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid profile data." });
    return;
  }
  const profile = parsed.data;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET
        name = $1,
        mobile_number = NULLIF($2, ''),
        house_flat_number = NULLIF($3, ''),
        street_locality = NULLIF($4, ''),
        area_ward = NULLIF($5, ''),
        city = NULLIF($6, ''),
        state = NULLIF($7, ''),
        profile_pin_code = NULLIF($8, ''),
        profile_landmark = NULLIF($9, ''),
        preferred_language = $10
       WHERE id = $11
       RETURNING ${profileColumns}`,
      [
        profile.name,
        profile.mobileNumber,
        profile.houseFlatNumber,
        profile.streetLocality,
        profile.areaWard,
        profile.city,
        profile.state,
        profile.pinCode,
        profile.landmark,
        profile.preferredLanguage,
        req.user.id,
      ],
    );
    if (!rows.length) {
      res.status(404).json({ error: "Profile not found." });
      return;
    }
    res.json({ profile: toProfile(rows[0]) });
  } catch (error) {
    next(error);
  }
});
