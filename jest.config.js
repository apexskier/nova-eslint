module.exports = {
  preset: "ts-jest",
  setupFiles: ["./src/test.setup.ts"],
  collectCoverage: true,
  collectCoverageFrom: ["./src/**"],
  coveragePathIgnorePatterns: ["/__snapshots__/"],
  coverageReporters: ["html"],
};
