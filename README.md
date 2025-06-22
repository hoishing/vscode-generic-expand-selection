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

### Expansion Examples

#### Basic Token Expansion

```javascript
const API_BASE_URL = 'https://api.example.com';
```

With cursor on `api` → `api.example.com` → `https://api.example.com` → full string

#### Nested Scopes

```javascript
const config = { url: 'https://example.com' };
```

With cursor on `example` → `example.com` → `https://example.com` → `[url]` → `{...}`

## Commands

- **`vscode-generic-expand-selection.expandSelection`**: Expand Selection
- **`vscode-generic-expand-selection.shrinkSelection`**: Shrink Selection

## Development

```bash
# Install dependencies
pnpm install

# Type check and lint (TypeScript and ESLint)
pnpm run check

# Run tests (builds TypeScript, runs esbuild, then executes tests)
pnpm run test

# Build, type check, lint, and package extension as out.vsix
pnpm run build

# Build and install the packaged extension locally (outputs out.vsix and installs it)
pnpm run vsce:install
```

## License

MIT License
