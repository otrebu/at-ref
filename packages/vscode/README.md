# At Ref

Navigate and validate `@path/to/file` references in markdown files - Claude Code companion.

## Features

### Navigation (Ctrl/Cmd+Click)
Navigate to referenced files by clicking on the path.

### Real-time Validation
Get immediate feedback on broken references with red squiggles.

### Autocomplete
Type `@` to see a list of available files to reference.

### Hover Preview
Hover over a reference to see a preview of the file content.

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
| `atReference.previewLines` | `10` | Hover preview lines |
| `atReference.enableFolding` | `true` | Enable code folding for `<file>` tags |
| `atReference.enableFileTagDecorations` | `true` | Highlight `<file>` tags |

## CLI Tool

For advanced features (folder compilation, workspace-wide validation), install the CLI:

```bash
npm install -g @u-b/at-ref
```

See [full documentation](https://github.com/otrebu/at-ref) for CLI usage.

## Related

- [Claude Code](https://claude.ai/code) - AI coding assistant
- [@u-b/at-ref](https://www.npmjs.com/package/@u-b/at-ref) - CLI and library

## License

MIT
