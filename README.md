# Generic Expand Selection

[![Test](https://github.com/dandehoon/vscode-generic-expand-selection/actions/workflows/test.yml/badge.svg)](https://github.com/dandehoon/vscode-generic-expand-selection/actions/workflows/test.yml)

Smartly expand or shrink your code selection, recover from misclicks or accidental cursor moves.

## Features

### Expansion Rules

- **Token Expansion**: Expands to word tokens, including identifiers with underscores and dots
- **Quote Scopes**: Expands to content within quotes (`"`, `'`, `` ` ``)
- **Bracket Scopes**: Expands to content within brackets (`[]`, `{}`, `()`)
- **Line Expansion**: Expands to full line content
- **Selection History**: Remember previous selections for step-by-step shrinking

## Usage

### Keybindings

- **Expand Selection**: `Ctrl+E` (Windows/Linux) or `Cmd+E` (Mac)
- **Retract Selection**: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

> [!TIP]
> Both commands work with single and multiple cursor selections.

### Expansion Examples

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

## Configuration

Customize token expansion by adding `genericExpandSelection.token.patterns` to your `settings.json`. This setting takes an array of regex strings, which are tried in order. You can set a global default and override it for specific languages.

```jsonc
{
  // Global setting for all languages
  "genericExpandSelection.token.patterns": [
    "[a-zA-Z0-9_-]+", // matches alphanumeric characters, underscores, and hyphens
    "[a-zA-Z0-9_\\-.]+", // matches identifiers with dots
    "[^\\s[\\]{}()\"'`]+" // matches any non-whitespace, non-bracket character
  ],

  // Override for a specific language (e.g., TypeScript)
  "[typescript]": {
    "genericExpandSelection.token.patterns": [
      "\\w+" // In TypeScript, only match word characters
    ]
  }
}
```

## Commands

- **`genericExpandSelection.expand`**: Expand Selection
- **`genericExpandSelection.shrink`**: Shrink Selection

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
