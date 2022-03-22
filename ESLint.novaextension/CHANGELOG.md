# Changelog

## future

- Revert fixes for Nova 9. See #277 for context.

## v1.7.1

- Fix for Nova 9

## v1.7.0

### Added

- Support custom rules directories

### Changed

- Improved Preferences meta-info

## v1.6.0

### Added

- Support [@html-eslint](https://yeonjuan.github.io/html-eslint/docs/getting-started.html)

### Changed

- Default paths in workspace preferences to relative paths

## v1.5.2

### Changed

- Add more info when mismatched document length error happens

## v1.5.1

### Fixed

- Fix cases where fix on save would produce broken code

## v1.5.0

### Added

- Show suggestions for all current lint violations, instead of just the first
- Add suggestion to ignore the current lint violation

### Fixed

- Fixed errors due to missing plugins in the console

## v1.4.0

### Added

- Support untitled (new, unsaved) documents

### Changed

- When fixing all issues, apply fixes atomically in editor before saving (way faster)

### Fixed

- Fixed linting failing when extension is first activated
- Automatically re-lint when preferences change

## v1.3.0

### Added

- Add preference to specify custom ESLint config path

### Fixed

- Fix file URIs to address project relative lint failures

## v1.2.1

### Fixed

- Fix errors when eslint executable isn't found

### Changed

- Requires readonly filesystem permissions

## v1.2.0

### Added

- Add support for HTML, Markdown, and Vue

### Changed

- Performance improvements
- Improved the "Apply a Suggestion" command
  - Add choice to fix all
  - Slight UX changes

## v1.1.0

### Added

- "Apply a Suggestion" editor command

## v1.0.1

### Fixed

- Fix "Fix on save" setting

## v1.0.0

### Added

- Auto-fix command
- Auto-fix on save
- Support for configuring eslint executable location

### Changed

- Performance improvements
- Use workspace-installed eslint by default

## v0.3.0

- Run eslint even when global not installed

## v0.2.0

- Added documentation to the README.
- Added support for linting TypeScript files.
- Fixed issue with registering issues by using the correct document URI.
- Simplified the formatting of the CHANGELOG.

## v0.1.0

- Initial release.
