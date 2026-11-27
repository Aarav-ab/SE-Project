import { Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { generateToken, AuthRequest } from "../middlewares/auth";
import { invalidateAllOperationalCaches } from "../config/cache";

function normalizePhone(raw: unknown): string {
  return String(raw ?? "").trim();
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const {
      email,
      password,
      name,
      phone,
      address,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      role,
    } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!minLength || !hasUpper || !hasNumber || !hasSpecial) {
      res.status(400).json({
        error:
          "Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.",
      });
      return;
    }

    const cleanPhone = phone !== undefined ? normalizePhone(phone) : "";
    if (cleanPhone && !isValidPhone(cleanPhone)) {
      res.status(400).json({ error: "Please enter a valid 10-digit contact number." });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
      },
    });

    if (existingUser) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "admin" ? "admin" : "citizen";

    const line1 = addressLine1 ? String(addressLine1).trim() : "";
    const line2 = addressLine2 ? String(addressLine2).trim() : "";
    const userCity = city ? String(city).trim() : "";
    const userState = state ? String(state).trim() : "";
    const userPincode = pincode ? String(pincode).trim() : "";
    const combinedAddress = address
      ? String(address).trim()
      : [line1, line2, userCity, userState, userPincode].filter(Boolean).join(", ");

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: String(name).trim(),
        phone: cleanPhone || null,
        address: combinedAddress || null,
        addressLine1: line1 || null,
        addressLine2: line2 || null,
        city: userCity || null,
        state: userState || null,
        pincode: userPincode || null,
        role: userRole,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Failed to create account." });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Please enter your email and password." });
      return;
    }

    const rawIdentifier = String(email).trim();
    const cleanEmail = rawIdentifier.toLowerCase();

    const user = await prisma.user.findFirst({
      where: rawIdentifier.includes("@")
        ? { email: cleanEmail }
        : {
            OR: [{ email: cleanEmail }, { phone: rawIdentifier }],
          },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    // Role validation
    if (role && user.role !== role) {
      res.status(403).json({
        error: `Access denied. This account has role '${user.role}', but you are attempting to log in as '${role}'.`,
      });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      message: "Signed in successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during sign in." });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        pincode: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ error: "Failed to retrieve user profile." });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const {
      name,
      phone,
      address,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
    } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Full name is required." });
      return;
    }

    const trimmedPincode = pincode ? String(pincode).trim() : "";
    if (trimmedPincode && !/^\d{6}$/.test(trimmedPincode)) {
      res.status(400).json({ error: "PIN code must be a valid 6-digit number." });
      return;
    }

    const trimmedPhone = phone !== undefined ? normalizePhone(phone) : undefined;
    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      res.status(400).json({ error: "Please enter a valid 10-digit contact number." });
      return;
    }

    const line1 = addressLine1 !== undefined ? String(addressLine1).trim() : undefined;
    const line2 = addressLine2 !== undefined ? String(addressLine2).trim() : undefined;
    const userCity = city !== undefined ? String(city).trim() : undefined;
    const userState = state !== undefined ? String(state).trim() : undefined;

    const hasStructuredParts =
      line1 !== undefined ||
      line2 !== undefined ||
      userCity !== undefined ||
      userState !== undefined ||
      pincode !== undefined;

    const combinedAddress = hasStructuredParts
      ? [line1, line2, userCity, userState, trimmedPincode]
          .filter(Boolean)
          .join(", ")
      : address !== undefined
      ? String(address).trim()
      : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: String(name).trim(),
        ...(trimmedPhone !== undefined ? { phone: trimmedPhone || null } : {}),
        ...(combinedAddress !== undefined ? { address: combinedAddress || null } : {}),
        ...(line1 !== undefined ? { addressLine1: line1 || null } : {}),
        ...(line2 !== undefined ? { addressLine2: line2 || null } : {}),
        ...(userCity !== undefined ? { city: userCity || null } : {}),
        ...(userState !== undefined ? { state: userState || null } : {}),
        ...(pincode !== undefined ? { pincode: trimmedPincode || null } : {}),
      },
    });

    invalidateAllOperationalCaches();

    const token = generateToken({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });

    res.json({
      message: "Profile updated successfully!",
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        addressLine1: updatedUser.addressLine1,
        addressLine2: updatedUser.addressLine2,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ error: "Failed to update profile details." });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { oldPassword, newPassword, email } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required." });
      return;
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email || (email ? String(email).trim().toLowerCase() : undefined);

    if (!userId && !userEmail) {
      res.status(401).json({ error: "Authentication session or registered email is required." });
      return;
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail },
    });

    if (!user) {
      res.status(404).json({ error: "User account not found." });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: "Current password does not match. Please verify your old password." });
      return;
    }

    const minLength = newPassword.length >= 8;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!minLength || !hasUpper || !hasNumber || !hasSpecial) {
      res.status(400).json({
        error:
          "New password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character.",
      });
      return;
    }

    if (oldPassword === newPassword) {
      res.status(400).json({ error: "New password cannot be identical to the current password." });
      return;
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ error: "Failed to update password." });
  }
}

export async function verifyPassword(req: AuthRequest, res: Response) {
  try {
    const { password, email } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email || (email ? String(email).trim().toLowerCase() : undefined);

    if (!userId && !userEmail) {
      res.status(401).json({ error: "Authentication session required.", valid: false });
      return;
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: userEmail },
    });

    if (!user) {
      res.status(404).json({ error: "User not found.", valid: false });
      return;
    }

    const isMatch = await bcrypt.compare(password || "", user.passwordHash);
    res.json({ valid: isMatch });
  } catch (error) {
    console.error("verifyPassword error:", error);
    res.status(500).json({ valid: false, error: "Verification failed." });
  }
}
