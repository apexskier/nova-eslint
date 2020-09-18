# Support

## I don't have eslint installed in the normal place

This extension looks for eslint in `$WorkspaceRoot/node_modules`.

If it's not there (e.g., it's installed globally or in a sub-directory), you can configure it's location in your workspace in the `.nova/Configuration.json` file or globally through your extension settings. Make sure your path is properly escaped!

```json
{
    "apexskier.eslint.config.eslintPath": "/Volumes/Macintosh HD/Users/cameronlittle/npm/eslint/bin/eslint.js"
}
```
