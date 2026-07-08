// .eslintrc.js

module.exports = {
    root: true,
    env: {
      browser: true,
      node: true,
    },
    extends: [
      '@nuxtjs',
      'plugin:vue/recommended',
      'eslint:recommended',
      'plugin:prettier/recommended',
    ],
    // Add your custom rules here
    rules: {
      // Example: Allow console statements in development
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // Add more rules as needed
    },
  }
  