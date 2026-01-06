# At Ref

Navigate and validate `@path/to/file` references in markdown files.

**Perfect companion for [Claude Code](https://claude.ai/code)** - the AI coding assistant that uses `@` references to include file context.

## Features

### 🔗 Navigation (Ctrl/Cmd+Click)
Click any `@path/to/file` reference to jump directly to that file.

### ⚠️ Real-time Validation
Broken references show red squiggles immediately. No more broken links in your documentation.

### 📝 Autocomplete
Type `@` to trigger intelligent file path suggestions. Autocomplete continues as you type `/` to navigate directories.

### 👁️ Hover Preview
Hover over any reference to see a preview of the file contents without leaving your current file.

### 📁 Compile Commands
Right-click to compile `@` references into expanded content - great for preparing context for AI assistants.

## Quick Start

1. Open any markdown file
2. Type `@` to trigger autocomplete
3. Select a file path
4. Ctrl/Cmd+Click to navigate

## Commands

| Command | Description |
|---------|-------------|
| Compile @References | Compile current file (right-click) |
| Compile @References in Folder | Compile entire folder (right-click in Explorer) |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `atReference.enableDiagnostics` | `true` | Show error squiggles |
| `atReference.enableCompletion` | `true` | Enable autocomplete |
| `atReference.enableHover` | `true` | Show file preview |
| `atReference.enableFolding` | `true` | Enable code folding for `<file>` tags |
| `atReference.enableFileTagDecorations` | `true` | Highlight nested file imports |
| `atReference.previewLines` | `10` | Hover preview lines |
| `atReference.compile.optimizeDuplicates` | `true` | Deduplicate imports in compiled output |

## CLI Tool

For advanced features (recursive validation, folder compilation), install the CLI:

```bash
npm install -g @u-b/at-ref
```

See [full documentation](https://github.com/uberto/at-ref) for CLI usage.

## Related

- [Claude Code](https://claude.ai/code) - AI coding assistant
- [@u-b/at-ref](https://www.npmjs.com/package/@u-b/at-ref) - CLI and library

## License

MIT
