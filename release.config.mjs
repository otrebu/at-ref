/**
 * Semantic Release Configuration
 *
 * Unified versioning for at-ref monorepo:
 * - Analyzes commits using conventional commit format
 * - Updates version in root and both package.json files
 * - Publishes @ub/at-ref to npm
 * - Creates GitHub release with changelog
 * - Commits version changes back to repo
 */
export default {
  branches: ["main"],
  plugins: [
    // 1. Analyze commits to determine version bump
    ["@semantic-release/commit-analyzer", {
      preset: "angular",
      releaseRules: [
        { breaking: true, release: "major" },
        { type: "feat", release: "minor" },
        { type: "fix", release: "patch" },
        { type: "perf", release: "patch" },
        { type: "docs", scope: "README", release: "patch" },
        { type: "chore", release: "patch" },
        { type: "refactor", release: "patch" },
        { type: "style", release: "patch" },
      ],
    }],

    // 2. Generate release notes
    "@semantic-release/release-notes-generator",

    // 3. Update CHANGELOG.md
    ["@semantic-release/changelog", {
      changelogFile: "CHANGELOG.md",
      changelogTitle: "# Changelog\n\nAll notable changes to this project will be documented in this file.",
    }],

    // 4. Update version in all package.json files (before npm publish)
    ["@semantic-release/exec", {
      prepareCmd: "node scripts/sync-versions.mjs ${nextRelease.version}",
    }],

    // 5. Publish @ub/at-ref to npm
    ["@semantic-release/npm", {
      pkgRoot: "packages/core",
    }],

    // 6. Commit version changes
    ["@semantic-release/git", {
      assets: [
        "CHANGELOG.md",
        "package.json",
        "packages/core/package.json",
        "packages/vscode/package.json",
        "pnpm-lock.yaml",
      ],
      message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
    }],

    // 7. Create GitHub release with VS Code extension attached
    ["@semantic-release/github", {
      assets: [
        {
          path: "packages/vscode/*.vsix",
          label: "VS Code Extension (${nextRelease.version})",
        },
      ],
    }],
  ],
};
