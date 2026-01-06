# At Ref

Navigate and validate `@path/to/file` references in markdown files (Claude Code companion).

## Features

- **Ctrl/Cmd+Click navigation** to jump to referenced files
- **Diagnostics (red squiggles)** for broken references
- **Autocomplete** when typing `@`
- **Hover preview** of referenced file contents
- **Compile commands** (file + folder)

## Quick start

1. Open a markdown file
2. Type `@` to get path suggestions
3. Ctrl/Cmd+Click a reference to navigate

## Commands

| Command | Description |
|---|---|
| `Compile @References` | Compile current file |
| `Compile @References in Folder` | Compile all markdown files in a folder |

## Settings

| Setting | Default | Description |
|---|---:|---|
| `atReference.enableDiagnostics` | `true` | Show errors for invalid references |
| `atReference.enableCompletion` | `true` | Enable file path autocomplete when typing `@` |
| `atReference.enableHover` | `true` | Show file preview on hover |
| `atReference.enableFolding` | `true` | Enable folding for `<file>` tags |
| `atReference.enableFileTagDecorations` | `true` | Add borders showing `<file>` nesting depth |
| `atReference.exclude` | `["**/node_modules/**","**/.git/**"]` | Exclude patterns for completion |
| `atReference.previewLines` | `10` | Hover preview line count |
| `atReference.compile.optimizeDuplicates` | `true` | Use self-closing `<file />` tags for duplicates |

## License

MIT
