# Generic Expand Selection

[![VS Code Marketplace](https://vsmarketplacebadges.dev/version/dandehoon.vscode-generic-expand-selection.png)](https://marketplace.visualstudio.com/items?itemName=dandehoon.vscode-generic-expand-selection)
[![Test](https://github.com/dandehoon/vscode-generic-expand-selection/actions/workflows/test.yml/badge.svg)](https://github.com/dandehoon/vscode-generic-expand-selection/actions/workflows/test.yml)

Smartly expand or shrink your code selection, recover from misclicks or accidental cursor moves.

## Features

### Rules

- **Token Expansion**: Expands to character tokens with customizable patterns.
- **Quote Expansion**: Expands to content within quotes (`"`, `'`, `` ` ``).
- **Scope Expansion**: Expands to content within open-close pairs (`[]`, `{}`, `()`).
- **Line Expansion**: Expands to full line(s) content.
- **Selection History**: Remember previous selections for step-by-step shrinking.

### Example

Text: `const config = { url: 'https://example.com' };`

```txt
With cursor on `xamp`, next expansions will be:
→ example
→ example.com
→ https://example.com
→ 'https://example.com'
→ url: 'https://example.com'
→ { url: 'https://example.com' }
→ const config = { url: 'https://example.com' }
→ const config = { url: 'https://example.com' };
```

## Usage

### Quick Install

[**Get it on VS Code Marketplace**](https://marketplace.visualstudio.com/items?itemName=dandehoon.vscode-generic-expand-selection)

### Commands & Keybindings

| Command                         | Default Keybinding                              | Description      |
| ------------------------------- | ----------------------------------------------- | ---------------- |
| `genericExpandSelection.expand` | `Ctrl+E` (Win/Linux), `Cmd+E` (Mac)             | Expand Selection |
| `genericExpandSelection.shrink` | `Ctrl+Shift+E` (Win/Linux), `Cmd+Shift+E` (Mac) | Shrink Selection |

> [!TIP]
> Both commands work with single and multiple cursor selections.

### Configuration

You can customize how selection expansion works by configuring settings in your VS Code `settings.json`.

#### Example: Common Settings

```jsonc
{
  // Token expansion patterns (global)
  "genericExpandSelection.token.patterns": [
    "[a-zA-Z0-9_-]+", // Alphanumeric, underscores, hyphens
    "[a-zA-Z0-9_\\-.]+", // Identifiers with dots
    "[^\\s[\\]{}()\"'`]+" // Non-whitespace, non-bracket
  ],

  // Language-specific overrides
  "[markdown]": {
    // Disable scope expansion in Markdown files to avoid issues with brackets
    "genericExpandSelection.scope.enabled": false
  },
  "[json]": {
    // Disable token expansion in JSON files to focus on quotes and scopes
    "genericExpandSelection.token.enabled": false
  },
  "[go]": {
    // Match partial key:"value" pairs in Go struct tags
    "genericExpandSelection.token.patterns": ["[a-zA-Z0-9]+:\"[^\"]*\""]
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Type check and lint (TypeScript and ESLint)
pnpm run check

# Run tests (builds TypeScript, runs esbuild, then executes tests)
pnpm run test

# Watch for changes and rebuild
pnpm run watch

# Build, type check, lint, and package extension as out.vsix
pnpm run build

# Build and install the packaged extension locally (outputs out.vsix and installs it)
pnpm run local
```

## License

MIT License
