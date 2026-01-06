# VS Code Extension Publishing Plan

Detailed plan for publishing the `at-ref` VS Code extension to:
1. **VS Code Marketplace** (marketplace.visualstudio.com)
2. **OpenVSX Registry** (open-vsx.org) - Used by Cursor IDE

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Asset Preparation](#2-asset-preparation)
3. [Package.json Updates](#3-packagejson-updates)
4. [Extension README Creation](#4-extension-readme-creation)
5. [License File](#5-license-file)
6. [VS Code Marketplace Setup](#6-vs-code-marketplace-setup)
7. [OpenVSX Registry Setup](#7-openvsx-registry-setup)
8. [CI/CD Pipeline Updates](#8-cicd-pipeline-updates)
9. [Manual Publishing (First Time)](#9-manual-publishing-first-time)
10. [Verification Checklist](#10-verification-checklist)

---

## 1. Prerequisites

### Required Accounts

| Platform | Account Type | URL |
|----------|-------------|-----|
| Azure DevOps | Microsoft Account | https://dev.azure.com |
| VS Code Marketplace | Publisher Account | https://marketplace.visualstudio.com/manage |
| OpenVSX | Eclipse Account (GitHub OAuth) | https://open-vsx.org |
| GitHub | Repository Access | Already configured |

### Required Tools

```bash
# Install globally
npm install -g @vscode/vsce    # VS Code Extension CLI
npm install -g ovsx            # OpenVSX CLI
```

### Required Secrets for CI/CD

| Secret Name | Source | Purpose |
|-------------|--------|---------|
| `VSCE_PAT` | Azure DevOps | VS Code Marketplace publishing |
| `OVSX_PAT` | OpenVSX | Cursor/OpenVSX publishing |

---

## 2. Asset Preparation

### 2.1 Extension Icon (REQUIRED)

The marketplace requires a **128x128 PNG icon** (minimum). Current state: **Missing**.

**Action Items:**

1. Create icon file: `packages/vscode/assets/icon.png`
   - Dimensions: 128x128 pixels (minimum), 256x256 recommended
   - Format: PNG only (SVG not allowed for security)
   - Design suggestion: Square crop of the "@" symbol from existing banner

2. Directory structure:
   ```
   packages/vscode/
   ├── assets/
   │   └── icon.png          # 128x128+ PNG
   ├── src/
   └── package.json
   ```

### 2.2 Gallery Banner (OPTIONAL but recommended)

For marketplace branding, can reuse existing banner.

**Options:**
- Use banner color from existing `assets/banner.png`: `#0d1117` (dark theme)
- Configure in package.json (see section 3)

### 2.3 Screenshots (OPTIONAL but recommended)

Create screenshots showing:
1. Autocomplete suggestions when typing `@`
2. Red squiggles on broken references
3. Hover preview showing file contents
4. Ctrl+Click navigation

Save to: `packages/vscode/assets/screenshots/`

---

## 3. Package.json Updates

Update `packages/vscode/package.json` with required marketplace metadata:

### 3.1 Publisher ID

```json
{
  "publisher": "otrebu"
}
```

**Note:** Publisher ID must match the registered publisher name on VS Code Marketplace. Choose one of:
- `otrebu` (matches GitHub org)
- `at-ref` (matches extension name)
- Create custom publisher name

### 3.2 Repository and Bug Tracking

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/otrebu/at-ref"
  },
  "bugs": {
    "url": "https://github.com/otrebu/at-ref/issues"
  },
  "homepage": "https://github.com/otrebu/at-ref#readme"
}
```

### 3.3 Icon Configuration

```json
{
  "icon": "assets/icon.png"
}
```

### 3.4 Gallery Banner (Optional)

```json
{
  "galleryBanner": {
    "color": "#0d1117",
    "theme": "dark"
  }
}
```

### 3.5 License

```json
{
  "license": "MIT"
}
```

### 3.6 Complete Updated package.json

```json
{
  "name": "at-ref",
  "displayName": "At Ref",
  "description": "Navigate and validate @path/to/file references in markdown files - Claude Code companion",
  "version": "1.0.1",
  "publisher": "otrebu",
  "license": "MIT",
  "icon": "assets/icon.png",
  "repository": {
    "type": "git",
    "url": "https://github.com/otrebu/at-ref"
  },
  "bugs": {
    "url": "https://github.com/otrebu/at-ref/issues"
  },
  "homepage": "https://github.com/otrebu/at-ref#readme",
  "galleryBanner": {
    "color": "#0d1117",
    "theme": "dark"
  },
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Other",
    "Linters",
    "Programming Languages"
  ],
  "keywords": [
    "claude",
    "claude-code",
    "markdown",
    "reference",
    "navigation",
    "documentation",
    "at-reference"
  ],
  ...
}
```

---

## 4. Extension README Creation

Create `packages/vscode/README.md` - this is displayed on the marketplace page.

**Key Differences from Root README:**
- Marketplace-focused (no installation from source)
- Feature showcase with screenshots
- Quick start guide
- Settings reference
- Link to CLI for full documentation

### 4.1 Recommended Structure

```markdown
# At Ref

Navigate and validate `@path/to/file` references in markdown files.

## Features

### Navigation (Ctrl/Cmd+Click)
![Navigation demo](./assets/screenshots/navigation.gif)

### Real-time Validation
![Validation demo](./assets/screenshots/validation.png)

### Autocomplete
![Autocomplete demo](./assets/screenshots/autocomplete.png)

### Hover Preview
![Hover demo](./assets/screenshots/hover.png)

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
```

### 4.2 Update .vscodeignore

Ensure assets are included but source is excluded:

```
.vscode/**
!.vscode/extensions.json
src/**
node_modules/**
tsconfig.json
*.map
.gitignore
pnpm-lock.yaml
**/*.ts
!assets/**
```

---

## 5. License File

Create `LICENSE` in repository root (currently missing):

```
MIT License

Copyright (c) 2024 otrebu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 6. VS Code Marketplace Setup

### 6.1 Create Azure DevOps Organization

1. Go to https://dev.azure.com
2. Sign in with Microsoft account
3. Create new organization (if needed)
4. Note the organization name (needed for PAT)

### 6.2 Create Personal Access Token (PAT)

1. In Azure DevOps, click User Settings (gear icon) → Personal Access Tokens
2. Click "New Token"
3. Configure:
   - **Name:** `vscode-marketplace-publish`
   - **Organization:** Select "All accessible organizations" (CRITICAL)
   - **Expiration:** Custom (max 1 year)
   - **Scopes:** Click "Custom defined" → Marketplace → Check "Manage"
4. Click "Create"
5. **COPY THE TOKEN IMMEDIATELY** (cannot be retrieved later)

### 6.3 Create Publisher

1. Go to https://marketplace.visualstudio.com/manage
2. Sign in with same Microsoft account
3. Click "Create publisher"
4. Fill in:
   - **ID:** `otrebu` (must match package.json publisher field - CANNOT BE CHANGED)
   - **Name:** `otrebu` (display name, can be changed)
5. Submit

### 6.4 Login via CLI

```bash
# Login to publisher
vsce login otrebu

# When prompted, paste the PAT
```

### 6.5 Verify Setup

```bash
# Test packaging (doesn't publish)
cd packages/vscode
vsce package --no-dependencies

# Should create at-ref-1.0.1.vsix without errors
```

---

## 7. OpenVSX Registry Setup

### 7.1 Create Eclipse Account

1. Go to https://open-vsx.org
2. Click "Log In" (top right)
3. Sign in with GitHub OAuth (recommended) or Eclipse account

### 7.2 Create Access Token

1. After login, click your username → Settings
2. Go to "Access Tokens"
3. Click "Generate New Token"
4. Configure:
   - **Description:** `ci-publish`
5. **COPY THE TOKEN IMMEDIATELY**

### 7.3 Create Namespace

Before first publish, create the namespace:

```bash
# Create namespace (matches publisher in package.json)
npx ovsx create-namespace otrebu --pat <YOUR_OVSX_PAT>
```

**Note:** If namespace already exists (created by someone else), you may need to:
- Choose a different publisher name, OR
- Claim namespace ownership via OpenVSX support

### 7.4 Verify Setup

```bash
# Test publishing to OpenVSX (dry run)
cd packages/vscode
npx ovsx publish --dry-run --pat <YOUR_OVSX_PAT>
```

---

## 8. CI/CD Pipeline Updates

### 8.1 Add GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
| Secret Name | Value |
|-------------|-------|
| `VSCE_PAT` | Azure DevOps PAT from step 6.2 |
| `OVSX_PAT` | OpenVSX token from step 7.2 |

### 8.2 Update release.yml

Replace `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: pnpm/action-setup@v4
        with:
          version: 10.25.0

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm semantic-release

      # Publish VS Code Extension to Marketplaces
      - name: Publish to VS Code Marketplace
        if: success()
        working-directory: packages/vscode
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: |
          npx @vscode/vsce publish --pat "$VSCE_PAT" --no-dependencies
        continue-on-error: true

      - name: Publish to OpenVSX (Cursor)
        if: success()
        working-directory: packages/vscode
        env:
          OVSX_PAT: ${{ secrets.OVSX_PAT }}
        run: |
          npx ovsx publish --pat "$OVSX_PAT" --no-dependencies
        continue-on-error: true
```

### 8.3 Alternative: Separate Publishing Job

For more control, use a separate job that only runs on version tags:

```yaml
name: Release

on:
  push:
    branches: [main]
    tags:
      - 'v*'

permissions:
  contents: write
  issues: write
  pull-requests: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: pnpm/action-setup@v4
        with:
          version: 10.25.0

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm semantic-release

  publish-extension:
    needs: release
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.25.0

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Publish to VS Code Marketplace
        working-directory: packages/vscode
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: npx @vscode/vsce publish --pat "$VSCE_PAT" --no-dependencies

      - name: Publish to OpenVSX (Cursor)
        working-directory: packages/vscode
        env:
          OVSX_PAT: ${{ secrets.OVSX_PAT }}
        run: npx ovsx publish --pat "$OVSX_PAT" --no-dependencies
```

### 8.4 Using GitHub Actions Marketplace

Alternative using pre-built actions:

```yaml
- name: Publish VS Code Extension
  uses: HaaLeo/publish-vscode-extension@v2
  with:
    pat: ${{ secrets.VSCE_PAT }}
    registryUrl: https://marketplace.visualstudio.com
    extensionFile: packages/vscode/*.vsix
    packagePath: packages/vscode

- name: Publish to OpenVSX
  uses: HaaLeo/publish-vscode-extension@v2
  with:
    pat: ${{ secrets.OVSX_PAT }}
    registryUrl: https://open-vsx.org
    extensionFile: packages/vscode/*.vsix
    packagePath: packages/vscode
```

---

## 9. Manual Publishing (First Time)

For the initial release, manual publishing is recommended to verify everything works.

### 9.1 Prepare Extension

```bash
# From repository root
cd packages/vscode

# Clean build
pnpm clean
pnpm build

# Verify package
vsce ls
# Should list all files to be included

# Create .vsix
vsce package --no-dependencies
# Creates: at-ref-1.0.1.vsix
```

### 9.2 Publish to VS Code Marketplace

```bash
# Login (if not already)
vsce login otrebu

# Publish
vsce publish --no-dependencies

# Or publish specific version
vsce publish 1.0.1 --no-dependencies
```

### 9.3 Publish to OpenVSX

```bash
# Create namespace first (one-time)
npx ovsx create-namespace otrebu --pat <YOUR_OVSX_PAT>

# Publish
npx ovsx publish --pat <YOUR_OVSX_PAT> --no-dependencies

# Or publish pre-built .vsix
npx ovsx publish at-ref-1.0.1.vsix --pat <YOUR_OVSX_PAT>
```

### 9.4 Verify Publications

After publishing:

1. **VS Code Marketplace:**
   - Visit: https://marketplace.visualstudio.com/items?itemName=otrebu.at-ref
   - Search "at-ref" in VS Code Extensions panel

2. **OpenVSX (Cursor):**
   - Visit: https://open-vsx.org/extension/otrebu/at-ref
   - Search "at-ref" in Cursor Extensions panel

---

## 10. Verification Checklist

### Pre-Publishing Checklist

- [ ] **Icon:** `packages/vscode/assets/icon.png` exists (128x128+ PNG)
- [ ] **README:** `packages/vscode/README.md` exists with marketplace content
- [ ] **License:** `LICENSE` file exists in repository root
- [ ] **package.json:** Has all required fields:
  - [ ] `publisher` matches registered publisher
  - [ ] `repository` URL
  - [ ] `icon` path
  - [ ] `license`
- [ ] **Secrets:** GitHub repository has:
  - [ ] `VSCE_PAT` (Azure DevOps)
  - [ ] `OVSX_PAT` (OpenVSX)
- [ ] **Namespaces:**
  - [ ] VS Code Marketplace publisher created
  - [ ] OpenVSX namespace created
- [ ] **Build:** `pnpm build` succeeds without errors
- [ ] **Package:** `vsce package` creates valid .vsix

### Post-Publishing Checklist

- [ ] Extension appears on VS Code Marketplace
- [ ] Extension appears on OpenVSX
- [ ] Extension installs correctly in VS Code
- [ ] Extension installs correctly in Cursor
- [ ] All features work:
  - [ ] Autocomplete triggers on `@`
  - [ ] Diagnostics show broken references
  - [ ] Hover shows file preview
  - [ ] Ctrl/Cmd+Click navigates to file
  - [ ] Compile commands work from context menu

---

## Summary: Step-by-Step Execution Order

### One-Time Setup (Do Once)

1. Create Azure DevOps organization and PAT
2. Create VS Code Marketplace publisher account
3. Create Eclipse/OpenVSX account and PAT
4. Create OpenVSX namespace
5. Add `VSCE_PAT` and `OVSX_PAT` to GitHub secrets

### Per-Release Tasks (Automated via CI after setup)

1. Create extension icon (128x128 PNG)
2. Create extension README.md
3. Update package.json with marketplace metadata
4. Add LICENSE file to repository root
5. Update .vscodeignore
6. Commit and push changes
7. Manual first publish to verify
8. Update CI/CD workflow for automated publishing

### Ongoing Maintenance

- PAT tokens expire (Azure DevOps max 1 year) - renew before expiration
- Update screenshots when UI changes
- Keep README current with new features

---

## References

- [VS Code Publishing Guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [OpenVSX Publishing Wiki](https://github.com/eclipse/openvsx/wiki/Publishing-Extensions)
- [Azure DevOps PAT Documentation](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [vsce CLI Reference](https://github.com/microsoft/vscode-vsce)
- [ovsx CLI Reference](https://github.com/eclipse/openvsx/blob/master/cli/README.md)
- [HaaLeo/publish-vscode-extension Action](https://github.com/HaaLeo/publish-vscode-extension)
