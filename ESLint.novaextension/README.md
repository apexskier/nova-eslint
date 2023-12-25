⚠️ **Archived**: Although it was fun to build my nova extensions, I haven't ended up using Nova regularly and can't devote the time to maintenance. Feel free to reach out if you want to fork and start maintaining an alternative.

# ESLint Extension for Nova

Provides integration with ESLint to lint your code.

## Features

- Inline ESLint issue reporting
- "Fix All Issues" command
- "Apply a Suggestion" command ([more information](https://eslint.org/docs/developer-guide/working-with-rules#providing-suggestions))
- Quick suggestion to ignore an issue
- Auto-fix on save preference
- Custom ESLint install locations
- Custom ESLint config file location
- Supports multiple file formats
  - Javascript/Typescript
  - HTML (requires [`eslint-plugin-html`](https://www.npmjs.com/package/eslint-plugin-html))
  - Markdown (requires [`eslint-plugin-markdown`](https://www.npmjs.com/package/eslint-plugin-markdown))
  - Vue (requires [`eslint-plugin-vue`](https://www.npmjs.com/package/eslint-plugin-vue) and the [Vue extension](nova://extension/?id=com.tommasonegri.Vue&name=Vue))

## Setup

To use this, follow the [Getting Started with ESLint](https://eslint.org/docs/user-guide/getting-started) instructions. You'll need to have ESLint installed locally in your project (it should be installed in `${workspaceRoot}/node_modules/eslint`). If you rely on a global or custom ESLint installation you can configure it by setting the "Path to ESLint executable" preference in Nova. This is accessible globally at Extensions > Extension Library… > ESLint > Preferences, and per-workspace at Project > Project Settings… > ESLint.

To verify you've set up correctly, run `$(npm bin)/eslint ./path/to/file.js` on a file and make sure the output is correct (no output if you don't expect issues, expected issues if you do).

### Screenshots

<img src="https://raw.githubusercontent.com/apexskier/nova-eslint/e041ad286b008f5b28402f19f8d2a79a3767d852/ESLint.novaextension/Images/inline-errors.png" alt="Inline errors" width="400" />

<img src="https://raw.githubusercontent.com/apexskier/nova-eslint/e041ad286b008f5b28402f19f8d2a79a3767d852/ESLint.novaextension/Images/sidebar-errors.png" alt="Sidebar errors" width="400" />

<img src="https://raw.githubusercontent.com/apexskier/nova-eslint/e041ad286b008f5b28402f19f8d2a79a3767d852/ESLint.novaextension/Images/suggestions.png" alt="Suggestions" width="400" />

### Fork

**NOTE:** This is a fork of an earlier version of this plugin. See https://github.com/jsmecham/nova-eslint/pull/6 for more context on why I forked.

**UPDATE:** Since forking, this extension has overtaken the original in total installs. Because forked repositories have some management limitations and the code has evolved so much, I've unforked on GitHub. The original fork is present at https://github.com/apexskier/nova-eslint-forked.
