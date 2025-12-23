# Publishing at-ref VS Code Extension

## Current State
- ✅ Extension packaged: `at-ref-0.2.0.vsix` (44KB)
- ✅ vsce configured, `pnpm package` works
- ✅ CI builds VSIX artifacts
- ✅ semantic-release setup exists
- ⚠️ `publisher: "at-ref"` in package.json → change to `"ub"`
- ❌ No extension icon
- ❌ No LICENSE file at root
- ❌ No extension-specific README
- ❌ Old .vsix files need cleanup

---

## Critical Issues (from reviews)

| Issue | Risk | Fix |
|-------|------|-----|
| Publisher mismatch (`at-ref` vs `ub`) | 🔴 FATAL | Update package.json to `"ub"` |
| No extension publishing in release.yml | 🔴 FATAL | Extend existing workflow |
| Missing tokens check in CI | 🔴 HIGH | Add token validation step |
| Old .vsix files pollute releases | 🟡 MED | Clean before build |
| Typecheck `continue-on-error: true` | 🟡 MED | Fix type errors first |

---

## Phase 1: Prerequisites

### 1.1 Create Accounts

**VS Code Marketplace:**
1. https://marketplace.visualstudio.com/manage
2. Login with Microsoft account
3. Create publisher ID: **`ub`**
4. ⚠️ Verify availability first!

**Azure DevOps PAT:**
1. https://dev.azure.com → User Settings → Personal Access Tokens
2. Scope: **Marketplace (Manage)** only
3. Expiration: 1 year (📅 set reminder!)
4. Copy immediately

**Open VSX:**
1. https://open-vsx.org (GitHub login)
2. https://open-vsx.org/user-settings/tokens
3. Copy immediately

### 1.2 GitHub Secrets

| Secret | Source |
|--------|--------|
| `VSCE_TOKEN` | Azure DevOps PAT |
| `OVSX_TOKEN` | Open VSX token |

---

## Phase 2: Required Assets

### 2.1 Update `packages/vscode/package.json`

```diff
- "publisher": "at-ref",
+ "publisher": "ub",
+ "icon": "images/icon.png",
+ "repository": {
+   "type": "git",
+   "url": "https://github.com/uberto/at-ref.git"
+ },
+ "homepage": "https://github.com/uberto/at-ref#readme",
+ "bugs": {
+   "url": "https://github.com/uberto/at-ref/issues"
+ },
```

### 2.2 Create Icon

**Location:** `packages/vscode/images/icon.png`
**Size:** 256x256 PNG (128x128 min)

**AI Generation Prompt:**
> Minimalist icon for a VS Code extension. The "@" symbol stylized as a modern, clean logo. Blue gradient (#007ACC to #0098FF). Simple geometric design. Square format, solid background. Suitable for 128x128px.

### 2.3 Create LICENSE

Create `LICENSE` at repo root with MIT text.

### 2.4 Clean Old .vsix Files

```bash
rm packages/vscode/*.vsix
```

---

## Phase 3: Extend release.yml

**DO NOT create separate publish.yml** - extend existing `release.yml`:

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
    outputs:
      new_release_published: ${{ steps.semantic.outputs.new_release_published }}
      new_release_version: ${{ steps.semantic.outputs.new_release_version }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test

      - name: Release
        id: semantic
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm semantic-release

  publish-extension:
    runs-on: ubuntu-latest
    needs: release
    if: needs.release.outputs.new_release_published == 'true'
    steps:
      - uses: actions/checkout@v4
        with:
          ref: v${{ needs.release.outputs.new_release_version }}

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Validate tokens exist
        run: |
          if [ -z "${{ secrets.VSCE_TOKEN }}" ]; then
            echo "::error::VSCE_TOKEN secret not set"
            exit 1
          fi
          if [ -z "${{ secrets.OVSX_TOKEN }}" ]; then
            echo "::error::OVSX_TOKEN secret not set"
            exit 1
          fi

      - name: Pre-publish validation
        run: |
          cd packages/vscode
          npx @vscode/vsce ls --no-dependencies

      - name: Publish to VS Code Marketplace
        id: vsce
        run: npx @vscode/vsce publish -p ${{ secrets.VSCE_TOKEN }} --no-dependencies
        working-directory: packages/vscode
        continue-on-error: true

      - name: Publish to Open VSX
        id: ovsx
        run: npx ovsx publish -p ${{ secrets.OVSX_TOKEN }}
        working-directory: packages/vscode
        continue-on-error: true

      - name: Verify at least one succeeded
        run: |
          if [ "${{ steps.vsce.outcome }}" == "failure" ] && [ "${{ steps.ovsx.outcome }}" == "failure" ]; then
            echo "::error::Both marketplace publishes failed!"
            exit 1
          fi
```

---

## Phase 4: First Publish (Manual)

### Pre-publish Checklist

- [ ] Publisher `ub` registered on VS Code Marketplace
- [ ] `VSCE_TOKEN` secret added
- [ ] `OVSX_TOKEN` secret added
- [ ] `packages/vscode/package.json` updated with publisher, icon, repo
- [ ] Icon exists at `packages/vscode/images/icon.png`
- [ ] LICENSE file at repo root
- [ ] Old .vsix files deleted
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes

### Manual Commands

```bash
cd packages/vscode

# Clean and rebuild
rm -f *.vsix
pnpm build

# Validate package
npx @vscode/vsce ls --no-dependencies

# Publish
npx @vscode/vsce publish -p $VSCE_TOKEN --no-dependencies
npx ovsx publish -p $OVSX_TOKEN
```

### Post-publish Verify

- https://marketplace.visualstudio.com/items?itemName=ub.at-ref
- https://open-vsx.org/extension/ub/at-ref

---

## Files to Modify

| File | Action |
|------|--------|
| `packages/vscode/package.json` | Update publisher, add icon/repo/bugs |
| `packages/vscode/images/icon.png` | Create (256x256 PNG) |
| `LICENSE` | Create at repo root |
| `.github/workflows/release.yml` | Add publish-extension job |
| `packages/vscode/*.vsix` | Delete old files |

---

## Maintenance

### Token Rotation

| Token | Expiry | Action |
|-------|--------|--------|
| Azure DevOps PAT | 1 year | Calendar reminder 2 weeks before |
| Open VSX | Never | Rotate annually anyway |

### Rollback

No rollback on marketplaces. Fix forward with patch release:
```bash
npx @vscode/vsce unpublish ub.at-ref  # LAST RESORT ONLY
```

---

## Decisions

- **Publisher ID**: `ub`
- **Icon**: AI-generated @-symbol
- **CI Strategy**: Extend release.yml (not separate workflow)
- **Error Handling**: Fail only if BOTH marketplaces fail
