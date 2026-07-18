// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
    // 1. Global ignores (folders ESLint should completely skip)
    {
        ignores: ["**/dist/**", "**/node_modules/**", "**/build/**"]
    },

    // 2. BACKEND Configuration (Node.js)
    {
        files: ["**/*.ts"],
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            "no-console": "off", // Often useful to allow console.log in backend services
        },
    },

    // 3. FRONTEND Configuration (React + Browser)

);