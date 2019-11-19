module.exports = {
  "env": {
    "commonjs": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "globals": {
    "CompositeDisposable": "readonly",
    "Issue": "readonly",
    "IssueCollection": "readonly",
    "IssueSeverity": "readonly",
    "Process": "readonly",
    "Range": "readonly",
    "console": "readonly",
    "nova": "readonly",
  },
  "parserOptions": {
    "ecmaVersion": 2018
  },
  "rules": {
    "indent": [ "error", 2 ],
    "linebreak-style": [ "error", "unix" ],
    "quotes": [ "error", "double" ],
    "semi": [ "error", "always" ]
  }
};