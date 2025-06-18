# Generic Expand Selection

Intelligently expand and retract text selections using smart scope detection. This extension provides progressive text selection that understands code structure and naturally expands to logical boundaries.

## Features

### Smart Progressive Expansion

- **Word Expansion**: Starts with intelligent word selection (excludes underscores from word boundaries)
- **Scope-Aware Selection**: Automatically detects and expands to various code constructs
- **Trimmed Content**: Always expands to trimmed content first, then includes delimiters
- **Size-Based Priority**: Chooses the smallest valid expansion for natural progression

### Supported Scopes

#### Quote Pairs

- Double quotes: `"content"`
- Single quotes: `'content'`
- Backticks: `` `content` ``

#### Delimiter Pairs

- Square brackets: `[content]`
- Curly braces: `{content}`
- Parentheses: `(content)`
- Angle brackets: `<content>`

#### Multi-Line Intelligence

- **Multi-line trimmed expansion**: When selection spans multiple lines, first expands to full trimmed content of those lines
- **Progressive line expansion**: Expands from partial line content to full trimmed line content

### Retract Functionality

- **Step-by-step shrink selection**: Undo expansions in reverse order
- **Selection history**: Maintains up to 100 previous selections
- **Smart history management**: Only stores selections when actual expansions occur

## Usage

### Keybindings

- **Expand Selection**: `Ctrl+E` (Windows/Linux) or `Cmd+E` (Mac)
- **Retract Selection**: `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

### Expansion Examples

#### Single Line Expansion

```javascript
const message = "Hello 'world' from `template`";
```

With cursor on `world`:

1. `world` → word selection
2. `'world'` → single quote scope
3. `"Hello 'world' from `template`"` → double quote scope
4. `const message = "Hello 'world' from `template`";` → full line (trimmed)

#### Multi-Line Expansion

```javascript
function example() {
  const data = {
    name: 'test',
    value: 42,
  };
}
```

With partial selection across lines 2-4:

1. First expands to full trimmed content of selected lines
2. Then expands to surrounding braces `{ ... }`
3. Then expands to function body
4. Finally expands to entire function

#### Nested Structures

```javascript
const config = { api: { url: 'https://example.com/api' } };
```

With cursor on `example.com`:

1. `example` → word
2. `https://example.com/api` → quote content
3. `"https://example.com/api"` → with quotes
4. `url: "https://example.com/api"` → object property
5. `{ url: "https://example.com/api" }` → inner object
6. `api: { url: "https://example.com/api" }` → outer property
7. `{ api: { url: "https://example.com/api" } }` → outer object
8. Full assignment → complete statement

### Settings

- **`expandSelection.enableSmartExpansion`** (boolean, default: `true`)
  - Enable smart expansion to nearest scoped characters
- **`expandSelection.logLevel`** (string, default: `"info"`)
  - Set logging level: `"debug"`, `"info"`, `"warn"`, `"error"`

## Commands

The extension contributes the following commands:

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

## Repository

[GitHub Repository](https://github.com/danztran/vscode-generic-expand-selection)
