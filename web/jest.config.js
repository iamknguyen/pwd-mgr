module.exports = {
  "roots": [
    "<rootDir>/src"
  ],
  "testMatch": [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)"
  ],
  "transform": {
    "^.+\\.(ts|tsx|js|jsx)$": "ts-jest"
  },
  "transformIgnorePatterns": [
    "node_modules",
    "public"
  ],
  "preset": "ts-jest",
  "globals": {
    "ts-jest": {
      "tsconfig": "./tsconfig.test.json"
    }
  },
  "setupFilesAfterEnv": [
    "./setupTests.js"
  ],
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node" 
  ],
  "moduleNameMapper": {
    "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/fileMock.js",
    "\\.(css|scss)$": "<rootDir>/fileMock.js"
  }
}
