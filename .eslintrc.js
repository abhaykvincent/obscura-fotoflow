module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    quotes: ["error", "double"],
    indent: ["error", 2],
    "object-curly-spacing": ["error", "always"], // Added for consistency
    "operator-linebreak": ["error", "after"],    // Added for consistency
  },
  parserOptions: {
    "ecmaVersion": 2020
  }
};
