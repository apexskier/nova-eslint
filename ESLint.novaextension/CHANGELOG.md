# Changelog

## future

### Added

- Support untitled (new, unsaved) documents

### Changed

- When fixing all issues, apply fixes atomically in editor before saving (make's them must faster)

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
