/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest/presets/default-esm", // Specific ESM preset
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        diagnostics: {
          ignoreCodes: [151001, 151002], // Clears that TS warning
        },
      },
    ],
  },

  // This tells Jest: "Don't ignore Faker, I need you to transform it"
  transformIgnorePatterns: ["node_modules/(?!(@faker-js/faker)/)"],

  moduleNameMapper: {
    // This handles the NodeNext requirement of .js extensions in imports
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  forceExit: true,
};
