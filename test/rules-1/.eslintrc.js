module.exports = {
  plugins: ["custom-rules"],
  extends: ["../../.eslintrc"],
  rules: {
    "custom-rules/test-rule": 1,
  },
};
