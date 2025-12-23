# Changelog

All notable changes to this project will be documented in this file.

# 1.0.0 (2025-12-23)


* feat!: migrate to dual-attribute file tag format with XML escaping ([02051da](https://github.com/otrebu/at-ref/commit/02051da2cef447c1a0e41ab8309b654a1bbf37e8))
* feat!: rename npm scope from [@ub](https://github.com/ub) to [@u-b](https://github.com/u-b) ([7562f8e](https://github.com/otrebu/at-ref/commit/7562f8ef8eebb28be63f3ca96a220daf83114ca5))
* feat!: rename packages and add semantic-release CI/CD ([a389b74](https://github.com/otrebu/at-ref/commit/a389b74b3622757908c04aae9ddee308d5f117b1))


### Bug Fixes

* **release:** add NODE_AUTH_TOKEN for npm authentication ([8334cef](https://github.com/otrebu/at-ref/commit/8334cef78cb0aaa5ce4e483ebea25cb0564dba9c))
* **release:** add repositoryUrl for semantic-release after repo rename ([60c7cea](https://github.com/otrebu/at-ref/commit/60c7cea21941aa528be4f5eb3fd070853be348bb))
* resolve bare [@paths](https://github.com/paths) from workspace root instead of document dir ([6d892f9](https://github.com/otrebu/at-ref/commit/6d892f955fa4ce342db0f7aa91c7dcebbf66ad91))
* **vscode:** add non-null assertions for strict TypeScript checks ([a109fa9](https://github.com/otrebu/at-ref/commit/a109fa99b791690e6f636a3c8e4385eac9c841ca))


### Features

* add check command to scan and list broken links by file ([ea2bdb1](https://github.com/otrebu/at-ref/commit/ea2bdb11bcab5b4687c2bd9d8872272e92bddde9))
* add compile command to expand [@references](https://github.com/references) in docs ([4fe04b1](https://github.com/otrebu/at-ref/commit/4fe04b1726668862ec22f910f294af0fdb8d7c5c))
* **cli:** add folder mode detection and --output-dir flag ([86bf992](https://github.com/otrebu/at-ref/commit/86bf9922706d63bb34d69a7f12e757a05bb11b06))
* **cli:** add validation modes and formatter output options ([ba2e149](https://github.com/otrebu/at-ref/commit/ba2e149965caf274d1575a56d4ab7182549b273e))
* **compile:** add frontmatter skip and duplicate optimization ([70cf2d8](https://github.com/otrebu/at-ref/commit/70cf2d8c0e9d9539ae11478bd83d5adef84921b4))
* **compiler:** add bottom-up folder compilation with dependency graph analysis ([7963045](https://github.com/otrebu/at-ref/commit/7963045769afba9e8b991edd8201598b4257d4da))
* **compiler:** add heading level adjustment for imported content ([9c82b08](https://github.com/otrebu/at-ref/commit/9c82b0891f0302169b94bb21c04cf6218958ee5a))
* **compiler:** implement dual heading adjustment modes (normalize/additive) ([311c445](https://github.com/otrebu/at-ref/commit/311c445cc11276917fa8c9d714a119bc4ea63a63))
* **docs:** add VS Code extension publishing checklist ([681bc20](https://github.com/otrebu/at-ref/commit/681bc205a1b929755258c6e94a7d5c09e78f2be6))
* ignore @ references inside backticks (code spans) ([cb6a269](https://github.com/otrebu/at-ref/commit/cb6a269be8a19777fa793e24e1dfe5cff85298f1))
* implement at-reference core library and VS Code extension ([45fd8b9](https://github.com/otrebu/at-ref/commit/45fd8b986230faf1e9b695fd31368df3ab89d5c8))
* recursive compilation with circular dependency detection ([beda4be](https://github.com/otrebu/at-ref/commit/beda4be7ef47d83585c35538582907f202752444))
* **validator:** add recursive validation and broken reference grouping ([ceb390f](https://github.com/otrebu/at-ref/commit/ceb390f24cb16362664983ea636af67a93e929d6))
* **vscode:** add custom folding for <file> tags in markdown ([443c304](https://github.com/otrebu/at-ref/commit/443c304a0544ee0a8666e48297224c4a55f27c00))
* **vscode:** add decoration provider for visual reference feedback ([3ca2532](https://github.com/otrebu/at-ref/commit/3ca25321cff1fc9365a55b4573a8cfd598fe5c08))
* **vscode:** add file tag decorations and refactor folding logic ([8f203f2](https://github.com/otrebu/at-ref/commit/8f203f27190b664448b89ca4c7ae4e188057bd26))


### BREAKING CHANGES

* Package renamed from @ub/at-ref to @u-b/at-ref

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
* Package names changed
- @at-reference/core → @ub/at-ref
- at-reference-support → at-ref

Added:
- GitHub Actions CI workflow (typecheck, test, build)
- semantic-release for automated npm publishing
- Version sync script for unified monorepo versioning

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
* File tag format now uses name and path attributes instead of single path attribute.

Before: <file path="/full/path/to/file.md">content</file>
After: <file name="file.md" path="~/project/to/file.md">content</file>

Changes:
- Add `name` attribute (basename) to all file tags
- Shorten paths with ~ for home directory
- Implement XML escaping for attribute values (&<>")
- Update VS Code extension regex patterns for folding/decorations
- Update all tests to match new tag format
- Document breaking change in CLAUDE.md and README.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
