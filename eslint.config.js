export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "build/**",
      "*.config.js",
      "postcss.config.js",
      "tailwind.config.js"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        alert: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": "off"
    }
  }
];
