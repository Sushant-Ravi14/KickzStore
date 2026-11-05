const authService = require("../services/auth.service");

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        role: result.user.role,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        role: result.user.role,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;
      await authService.logout(userId, refreshToken);
      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
