module.exports = {
  "env": {
    "commonjs": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "globals": {
    "AssistantsRegistry": "readonly",
    "Color": "readonly",
    "CommandsRegistry": "readonly",
    "CompletionContext": "readonly",
    "CompletionItem": "readonly",
    "CompositeDisposable": "readonly",
    "Configuration": "readonly",
    "Console": "readonly",
    "Disposable": "readonly",
    "Emitter": "readonly",
    "File": "readonly",
    "FileStats": "readonly",
    "FileSystem": "readonly",
    "FileSystemWatcher": "readonly",
    "Issue": "readonly",
    "IssueCollection": "readonly",
    "IssueSeverity": "readonly",
    "LanguageClient": "readonly",
    "NotificationCenter": "readonly",
    "NotificationRequest": "readonly",
    "NotificationResponse": "readonly",
    "Path": "readonly",
    "Process": "readonly",
    "ProcessMessage": "readonly",
    "Range": "readonly",
    "Symbol": "readonly",
    "TextDocument": "readonly",
    "TextEditor": "readonly",
    "TextEditorEdit": "readonly",
    "TreeDataProvider": "readonly",
    "TreeItem": "readonly",
    "TreeView": "readonly",
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