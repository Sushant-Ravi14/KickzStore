module.exports = {
  testEnvironment: "node",
  testTimeout: 30000,
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "services/**/*.js",
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "!**/node_modules/**",
  ],
  coverageReporters: ["text", "lcov", "clover"],
};
