# Contributing

## Development

### Running locally

Clone this project, and open it in Nova.

Run `yarn` in a terminal to install dependencies.

Run the Development task to build scripts and auto-rebuild on file changes.

Turn on extension development in Nova in Preferences > General > Extension Development. If you've installed the extension from the Extension Library, disable it, then activate the local one with Extensions > Activate Project as Extension.

### Debugging

Use the Extension Console in Nova to debug the extension. I haven't found a way to get a debugger attached to the JavaScriptCore context.

## Pull Requests

### Changelog

All user-facing changes should be documented in [CHANGELOG.md](./CHANGELOG.md).

- If not present, add a `## future` section above the latest release
- If not present, add a `###` heading for the category of your changes. Categories can include
  - Breaking - backwards incompatible changes (semver major version bump)
  - Added - new features (semver minor version bump)
  - Fixed - bugfixes (semver patch version bump)
  - Changed - tweaks or changes that don't significantly change how the extension is used
- Add a single line for each change you've made

## Publishing notes

Always run `yarn build` first, so the `ESLint.novaextension/node_modules` directory is cleared.

Replace `future` in the changelog with a new version, following semver. Update the version in the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.md), [`package.json`](./package.json), and [extension manifest](./ESLint.novaextension/extension.json).
