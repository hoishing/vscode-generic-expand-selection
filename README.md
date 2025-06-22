# Generic Expand Selection

[![Test](https://github.com/dandehoon/vscode-generic-expand-selection/actions/workflows/test.yml/badge.svg)](https://github.com/dandehoon/vscode-generic-expand-selection/actions/workflows/test.yml)

Intelligently expand and retract text selections using smart scope detection. This extension provides progressive text selection that understands code structure and naturally expands to logical boundaries.

## Features

### Smart Progressive Expansion

- **Token Expansion**: Expands to word tokens, including identifiers with underscores and dots
- **Quote Scopes**: Expands to content within quotes (`"`, `'`, `` ` ``) with trimmed content first
- **Bracket Scopes**: Expands to content within brackets (`[]`, `{}`, `()`, `<>`)
- **Line Expansion**: Expands to full line content with automatic trimming
- **Selection History**: Remember previous selections for step-by-step shrinking (up to 100 selections)

### Expansion Logic

1. **Token-based**: Finds the next logical token or word boundary
2. **Trimmed Content First**: Always expands to trimmed content before including delimiters
3. **Smallest Valid**: Chooses the smallest containing scope for natural progression
4. **Multi-scope Support**: Handles nested quotes, brackets, and mixed delimiter types

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

#### Multi-line Content

```javascript
function test() {
  return {
    status: 'ok',
  };
}
```

Selection expands progressively through scopes, with automatic content trimming.

## Commands

- **`vscode-generic-expand-selection.expandSelection`**: Expand Selection
- **`vscode-generic-expand-selection.shrinkSelection`**: Shrink Selection

## Development

```bash
# Install dependencies
pnpm install

# Development with watch mode
pnpm run watch

# Compile once
pnpm run compile

# Run tests
pnpm test

# Package extension
pnpm run package

# Install locally
pnpm run vscode:install
```

## License

MIT License
