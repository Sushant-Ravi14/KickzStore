const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const crypto = require("crypto");

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: user._id, type: "refresh", jti: crypto.randomUUID() },
      config.JWT_REFRESH_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  async register({ firstName, lastName, email, password, phoneNumber, address }) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError("Email is already registered", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phoneNumber,
      address,
      role: "user", // Enforce default user role on registration
      isActive: true,
    });

    const { accessToken, refreshToken } = this.generateTokens(newUser);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);
    newUser.refreshTokens = [{ token: refreshToken, expiresAt: refreshExpiry }];

    await newUser.save();

    return {
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.isActive === false) {
      throw new AppError("Account has been deactivated. Please contact support.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    // Keep up to 5 active refresh tokens (multi-device) and purge expired ones
    const now = new Date();
    const validTokens = (user.refreshTokens || []).filter((t) => t.expiresAt > now);
    validTokens.push({ token: refreshToken, expiresAt: refreshExpiry });
    user.refreshTokens = validTokens.slice(-5);

    await user.save();

    return {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(incomingRefreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, config.JWT_REFRESH_SECRET);
    } catch (_err) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isActive === false) {
      throw new AppError("User not found or deactivated", 401);
    }

    // Token reuse detection
    const tokenRecordIndex = (user.refreshTokens || []).findIndex(
      (t) => t.token === incomingRefreshToken && t.expiresAt > new Date()
    );

    if (tokenRecordIndex === -1) {
      // Possible token reuse attempt: invalidate all user refresh tokens for safety
      user.refreshTokens = [];
      await user.save();
      throw new AppError("Refresh token was revoked or reused. Please log in again.", 401);
    }

    // Rotate refresh token
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

    const refreshExpiry = new Date();
    refreshExpiry.setDate(refreshExpiry.getDate() + 7);

    user.refreshTokens[tokenRecordIndex] = {
      token: newRefreshToken,
      expiresAt: refreshExpiry,
    };

    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId, tokenToRevoke) {
    if (!userId) return;
    const user = await User.findById(userId);
    if (!user) return;

    if (tokenToRevoke) {
      user.refreshTokens = (user.refreshTokens || []).filter((t) => t.token !== tokenToRevoke);
    } else {
      user.refreshTokens = [];
    }
    await user.save();
  }
}

module.exports = new AuthService();
