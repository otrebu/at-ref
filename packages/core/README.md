# @u-b/at-ref

CLI tool to validate and compile `@path/to/file` references in markdown documents.

## Installation

```bash
# Run without installing
npx @u-b/at-ref validate .

# Install globally
npm install -g @u-b/at-ref
at-ref validate .

# Add to project
pnpm add -D @u-b/at-ref
```

## Commands

### validate (default)
Check that all `@references` point to existing files.

```bash
at-ref CLAUDE.md              # validate single file
at-ref docs/                  # validate directory
at-ref . --shallow --quiet    # fast CI check
```

### check
Workspace audit - find all broken references grouped by target.

```bash
at-ref check                  # audit current directory
at-ref check docs/ --verbose  # detailed breakdown
```

### compile
Expand `@references` inline, creating self-contained documents.

```bash
at-ref compile CLAUDE.md                    # → CLAUDE.built.md
at-ref compile docs/ --optimize-duplicates  # compile folder
at-ref compile README.md -o out.md          # custom output
```

## Common Options

| Flag | Description |
|------|-------------|
| `--shallow` | Fast validation (direct refs only) |
| `--quiet` | Only show errors |
| `--verbose` | Show all references |
| `--optimize-duplicates` | Include each file once (compile) |
| `--ignore <pattern>` | Skip matching paths |

## Exit Codes

- `0` - All references valid
- `1` - Broken references found

## Links

- [GitHub](https://github.com/otrebu/at-ref)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=at-ref.at-ref)
- [Full Documentation](https://github.com/otrebu/at-ref#readme)
