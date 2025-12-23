---
layout: default
---

<p align="center">
  <img src="assets/banner.png" alt="at-ref - tooling for @path/to/file references" width="100%">
</p>

**Tooling for Claude Code's `@path/to/file` reference syntax**

Parse, validate, and compile `@path/to/file` references in markdown. CLI tool and VS Code extension for validation, navigation, and compilation.

## What is @reference syntax?

Claude Code uses `@path/to/file` syntax to reference files in markdown documentation. This project provides tools to:
- **Validate** references (ensure they point to existing files)
- **Navigate** between files (jump to references in your editor)
- **Compile** documentation (expand references inline for self-contained docs)

```markdown
<!-- Example usage -->
See @src/parser.ts for implementation details.
Configuration is in @config/settings.json.
```

## Features

### CLI Tool (`at-ref`)

#### Validation with Multiple Modes
- **Recursive validation (default)** - Validates entire dependency tree
  - When A.md references B.md, and B.md references C.md, validates all 3 files
  - Finds all broken references, including nested dependencies
- **Shallow mode (`--shallow`)** - Fast validation of direct references only
  - ~2x faster, ideal for CI/CD pipelines
  - Only checks references in specified files
- **Check command** - Workspace-wide broken reference audit
  - Scans all markdown files in a directory
  - Groups broken references by target file (shows what's missing and who references it)

#### Compilation with Optimization
- **Single file compilation** - Expand references inline with full file contents
- **Folder compilation** - Compile entire directories with:
  - Dependency-aware ordering (bottom-up, dependencies compiled first)
  - Cross-file caching for massive size reduction with `--optimize-duplicates`
  - Automatic frontmatter stripping (always enabled)
- **Heading level adjustment** - Automatic heading hierarchy management:
  - Normalize mode (default) - preserves relative heading structure
  - Additive mode (`--additive-headings`) - legacy cumulative shift

#### Flexible Output Formats
- **Default** - Per-file details with broken references grouped by target
- **Summary** - Compact stats view for multi-file validation
- **Verbose** - Show all references (valid + broken) per file
- **Quiet** - Only show files with errors (perfect for CI)

### VS Code Extension (`at-ref`)

#### Navigation & Feedback
- **Ctrl/Cmd+Click** - Navigate to referenced files instantly
- **Red squiggles** - Real-time validation with error messages
- **Blue decorations** - Visual indicators for valid references
- **Hover preview** - View file contents without opening (configurable line count)

#### Autocomplete
- **Type `@` or `/`** - Get intelligent file path suggestions
- **Respects .gitignore** - Automatically excludes common patterns

#### Context Menu Commands
- **"Compile @References"** - Right-click in editor to compile current file
- **"Compile @References in Folder"** - Right-click folder in explorer to compile all markdown files

#### Configuration Options
5 settings available in VS Code Settings (`atReference.*`):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enableDiagnostics` | boolean | `true` | Show error squiggles for invalid references |
| `enableCompletion` | boolean | `true` | Enable autocomplete when typing `@` |
| `enableHover` | boolean | `true` | Show file preview on hover |
| `exclude` | array | `["**/node_modules/**", "**/.git/**"]` | Patterns to exclude from autocomplete |
| `previewLines` | number | `10` | Number of lines to show in hover preview |

## Installation

### CLI Installation

```bash
npm install -g @u-b/at-ref
```

Or build from source:
```bash
git clone https://github.com/otrebu/at-ref.git
cd at-ref
pnpm install && pnpm build

# Link globally
cd packages/core
pnpm link --global

# Now use anywhere
at-ref CLAUDE.md
```

### VS Code Extension Installation

Search for "at-ref" in the VS Code Extensions marketplace, or install manually:

```bash
cd packages/vscode
pnpm build
pnpm package  # Creates .vsix file
```

Then in VS Code: `Extensions → ... → Install from VSIX`

## Usage

### CLI Usage

#### Validation (Default Command)

```bash
# Recursive validation (default) - validates entire dependency tree
at-ref CLAUDE.md

# Fast shallow mode - only direct references
at-ref CLAUDE.md --shallow

# Output modes
at-ref docs/                     # Per-file breakdown
at-ref docs/ --summary           # Compact stats
at-ref docs/ --quiet             # Only files with errors
at-ref docs/ --verbose           # Show all references per file

# Ignore patterns (can use multiple times)
at-ref . --ignore "node_modules" --ignore "vendor"
```

#### Check Command

Scan workspace for broken references, grouped by target file:

```bash
# Check all markdown files in current directory
at-ref check

# Check specific directory
at-ref check docs/

# Verbose mode shows per-file breakdown
at-ref check --verbose
```

#### Compilation

**Single File:**
```bash
# Basic compilation (creates CLAUDE.built.md)
at-ref compile CLAUDE.md

# Custom output path
at-ref compile CLAUDE.md --output CLAUDE.compiled.md

# Optimization flags (frontmatter always stripped)
at-ref compile CLAUDE.md --optimize-duplicates
```

**Folder Compilation:**
```bash
# Compile entire directory (creates dist/ folder)
at-ref compile docs/

# With optimization (massive size reduction for interconnected files)
at-ref compile docs/ --optimize-duplicates
```

## Examples

### Knowledge Base Compilation
Compile interconnected notes into self-contained documents:
```bash
at-ref compile notes/ --optimize-duplicates
```

### CI/CD Validation Pipeline
Fast validation for continuous integration:
```bash
# .github/workflows/validate-docs.yml
- name: Validate references
  run: at-ref . --shallow --quiet
```

### Documentation Audit
Find all broken references across your project:
```bash
at-ref check --verbose
```

## Architecture

### Reference Syntax Rules
- **Pattern**: `@path/to/file` or `@./relative/path`
- **Must contain**: `/` or file extension (to avoid matching emails like `user@domain.com`)
- **Ignored**: References inside code spans (backticks) are not parsed
- **Resolution**: Relative to referencing file's directory, tries `.md` extension and `/index.md`

### Core Library Flow

1. **parser.ts** - Extract `@references` via regex
2. **resolver.ts** - Convert paths to absolute
3. **validator.ts** - Check file existence (recursive by default)
4. **compiler.ts** - Expand references inline with circular detection
5. **heading-adjuster.ts** - Adjust heading levels based on context
6. **dependency-graph.ts** - Build and sort dependency graphs

## API Reference

Use `@u-b/at-ref` programmatically:

```typescript
import {
  extractReferences,
  validateFile,
  compileFile
} from '@u-b/at-ref';

// Parse references from text
const refs = extractReferences('See @src/index.ts for details');

// Validate file (recursive by default)
const result = validateFile('./CLAUDE.md');

// Compile file
const compiled = compileFile('input.md', {
  outputPath: 'output.md',
  optimizeDuplicates: true
});
```

## Contributing

We welcome contributions! Guidelines:
- **Run tests** before submitting PRs: `pnpm test`
- **Follow existing code style**: TypeScript strict mode, clear naming
- **Add tests** for new features

## License

MIT
