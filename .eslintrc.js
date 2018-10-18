module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "settings": {
    "polyfills": [
      "Array.isArray",
      "console",
      "Error",
      "JSON",
      "Object.assign",
      "Object.keys"
    ]
  },
  "extends": ["ash-nazg/sauron"],
  "overrides": [
    // Our Markdown rules (and used for JSDoc examples as well, by way of
    //   our use of `matchingFileName` in conjunction with
    //   `jsdoc/check-examples` within `ash-nazg`)
    {
      files: ["**/*.md"],
      rules: {
        "eol-last": ["off"],
        "no-console": ["off"],
        "no-undef": ["off"],
        "no-unused-vars": ["warn"],
        "padded-blocks": ["off"],
        "import/unambiguous": ["off"],
        "import/no-unresolved": ["off"],
        "node/no-missing-import": ["off"],
        "no-multi-spaces": "off",
        // Disable until may fix https://github.com/gajus/eslint-plugin-jsdoc/issues/211
        "indent": "off"
      }
    }
  ],
  "globals": {
    "Atomics": "readonly",
    "SharedArrayBuffer": "readonly"
  },
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "rules": {
  }
};
