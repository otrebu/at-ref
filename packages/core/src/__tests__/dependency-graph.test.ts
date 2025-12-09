import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  buildDependencyGraph,
  topologicalSort,
  detectCircularDependencies,
  type DependencyGraph
} from '../dependency-graph';

// Test helper to create temp files
function createTempFile(name: string, content: string, dir: string): string {
  const filePath = path.join(dir, name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('dependency-graph', () => {
  describe('buildDependencyGraph', () => {
    it('builds graph for single file with no dependencies', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileA = createTempFile('a.md', '# File A\nNo references here', tmpDir);

        const graph = buildDependencyGraph([fileA]);

        assert.strictEqual(graph.nodes.size, 1);
        assert.ok(graph.nodes.has(fileA));

        const node = graph.nodes.get(fileA)!;
        assert.strictEqual(node.dependencies.size, 0);
        assert.strictEqual(node.dependents.size, 0);

        assert.ok(graph.rootFiles.has(fileA));
        assert.strictEqual(graph.errors.length, 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('builds graph for linear dependency (A → B)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileB = createTempFile('b.md', '# File B\nLeaf node', tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);

        const graph = buildDependencyGraph([fileA, fileB]);

        assert.strictEqual(graph.nodes.size, 2);

        const nodeA = graph.nodes.get(fileA)!;
        assert.ok(nodeA.dependencies.has(fileB));
        assert.strictEqual(nodeA.dependents.size, 0);

        const nodeB = graph.nodes.get(fileB)!;
        assert.strictEqual(nodeB.dependencies.size, 0);
        assert.ok(nodeB.dependents.has(fileA));

        assert.ok(graph.rootFiles.has(fileB));
        assert.ok(!graph.rootFiles.has(fileA));
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('builds graph for diamond dependency (A → B, A → C, B → D, C → D)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileD = createTempFile('d.md', '# File D', tmpDir);
        const fileB = createTempFile('b.md', `# File B\n@${fileD}`, tmpDir);
        const fileC = createTempFile('c.md', `# File C\n@${fileD}`, tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}\n@${fileC}`, tmpDir);

        const graph = buildDependencyGraph([fileA, fileB, fileC, fileD]);

        assert.strictEqual(graph.nodes.size, 4);

        const nodeA = graph.nodes.get(fileA)!;
        assert.strictEqual(nodeA.dependencies.size, 2);
        assert.ok(nodeA.dependencies.has(fileB));
        assert.ok(nodeA.dependencies.has(fileC));

        const nodeD = graph.nodes.get(fileD)!;
        assert.strictEqual(nodeD.dependencies.size, 0);
        assert.strictEqual(nodeD.dependents.size, 2);
        assert.ok(nodeD.dependents.has(fileB));
        assert.ok(nodeD.dependents.has(fileC));

        assert.ok(graph.rootFiles.has(fileD));
        assert.ok(!graph.rootFiles.has(fileA));
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles external dependencies (not in compilation set)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const externalFile = createTempFile('external.md', '# External', tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${externalFile}`, tmpDir);

        // Only compile fileA, not external
        const graph = buildDependencyGraph([fileA]);

        assert.strictEqual(graph.nodes.size, 1);

        const nodeA = graph.nodes.get(fileA)!;
        assert.ok(nodeA.dependencies.has(externalFile));

        // External file has no node
        assert.ok(!graph.nodes.has(externalFile));

        // fileA is a root (its dependency is external)
        assert.ok(graph.rootFiles.has(fileA));
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('records error for missing dependency', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileA = createTempFile('a.md', '# File A\n@/nonexistent/file.md', tmpDir);

        const graph = buildDependencyGraph([fileA]);

        assert.strictEqual(graph.errors.length, 1);
        assert.strictEqual(graph.errors[0]?.type, 'missing');
        assert.strictEqual(graph.errors[0]?.missingDep, '/nonexistent/file.md');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles files with no @ references', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileA = createTempFile('a.md', '# File A\nJust some text\nemail@example.com', tmpDir);
        const fileB = createTempFile('b.md', '# File B\nMore text', tmpDir);

        const graph = buildDependencyGraph([fileA, fileB]);

        assert.strictEqual(graph.nodes.size, 2);
        assert.strictEqual(graph.rootFiles.size, 2);

        const nodeA = graph.nodes.get(fileA)!;
        assert.strictEqual(nodeA.dependencies.size, 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('topologicalSort', () => {
    it('sorts linear dependency correctly (C, B, A for A → B → C)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileC = createTempFile('c.md', '# File C', tmpDir);
        const fileB = createTempFile('b.md', `# File B\n@${fileC}`, tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);

        const graph = buildDependencyGraph([fileA, fileB, fileC]);
        const { sorted, cycles } = topologicalSort(graph);

        assert.strictEqual(sorted.length, 3);
        assert.strictEqual(cycles.length, 0);

        // C should come before B, B before A
        const indexC = sorted.indexOf(fileC);
        const indexB = sorted.indexOf(fileB);
        const indexA = sorted.indexOf(fileA);

        assert.ok(indexC < indexB);
        assert.ok(indexB < indexA);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('sorts diamond dependency with valid order', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileD = createTempFile('d.md', '# File D', tmpDir);
        const fileB = createTempFile('b.md', `# File B\n@${fileD}`, tmpDir);
        const fileC = createTempFile('c.md', `# File C\n@${fileD}`, tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}\n@${fileC}`, tmpDir);

        const graph = buildDependencyGraph([fileA, fileB, fileC, fileD]);
        const { sorted, cycles } = topologicalSort(graph);

        assert.strictEqual(sorted.length, 4);
        assert.strictEqual(cycles.length, 0);

        // D must be first
        assert.strictEqual(sorted[0], fileD);

        // A must be last
        assert.strictEqual(sorted[3], fileA);

        // B and C can be in any order (both depend on D)
        const indexB = sorted.indexOf(fileB);
        const indexC = sorted.indexOf(fileC);
        const indexD = sorted.indexOf(fileD);

        assert.ok(indexD < indexB);
        assert.ok(indexD < indexC);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('handles disconnected components', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        // Component 1: A → B
        const fileB = createTempFile('b.md', '# File B', tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);

        // Component 2: C → D
        const fileD = createTempFile('d.md', '# File D', tmpDir);
        const fileC = createTempFile('c.md', `# File C\n@${fileD}`, tmpDir);

        const graph = buildDependencyGraph([fileA, fileB, fileC, fileD]);
        const { sorted, cycles } = topologicalSort(graph);

        assert.strictEqual(sorted.length, 4);
        assert.strictEqual(cycles.length, 0);

        // Verify ordering within each component
        const indexA = sorted.indexOf(fileA);
        const indexB = sorted.indexOf(fileB);
        const indexC = sorted.indexOf(fileC);
        const indexD = sorted.indexOf(fileD);

        assert.ok(indexB < indexA);
        assert.ok(indexD < indexC);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('detects cycles and includes all files in output', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileB = createTempFile('b.md', '# File B (will ref A)', tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);

        // Create cycle by updating B
        fs.writeFileSync(fileB, `# File B\n@${fileA}`, 'utf-8');

        const graph = buildDependencyGraph([fileA, fileB]);
        const { sorted, cycles } = topologicalSort(graph);

        // All files should still be in sorted output
        assert.strictEqual(sorted.length, 2);
        assert.ok(cycles.length > 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('detectCircularDependencies', () => {
    it('detects simple two-node cycle (A ↔ B)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileB = createTempFile('b.md', '# File B (will ref A)', tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);
        fs.writeFileSync(fileB, `# File B\n@${fileA}`, 'utf-8');

        const graph = buildDependencyGraph([fileA, fileB]);
        const cycles = detectCircularDependencies(graph);

        assert.strictEqual(cycles.length, 1);
        assert.strictEqual(cycles[0]?.length, 2);

        // Cycle should contain both files
        const cycle = cycles[0]!;
        assert.ok(cycle.includes(fileA));
        assert.ok(cycle.includes(fileB));
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('detects three-node cycle (A → B → C → A)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileC = createTempFile('c.md', '# File C (will ref A)', tmpDir);
        const fileB = createTempFile('b.md', `# File B\n@${fileC}`, tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);
        fs.writeFileSync(fileC, `# File C\n@${fileA}`, 'utf-8');

        const graph = buildDependencyGraph([fileA, fileB, fileC]);
        const cycles = detectCircularDependencies(graph);

        assert.strictEqual(cycles.length, 1);
        assert.strictEqual(cycles[0]?.length, 3);

        const cycle = cycles[0]!;
        assert.ok(cycle.includes(fileA));
        assert.ok(cycle.includes(fileB));
        assert.ok(cycle.includes(fileC));
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('detects self-reference (A → A)', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileA = createTempFile('a.md', '# File A', tmpDir);
        fs.writeFileSync(fileA, `# File A\n@${fileA}`, 'utf-8');

        const graph = buildDependencyGraph([fileA]);
        const cycles = detectCircularDependencies(graph);

        assert.strictEqual(cycles.length, 1);
        assert.strictEqual(cycles[0]?.length, 1);
        assert.strictEqual(cycles[0]?.[0], fileA);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('finds no cycles in acyclic graph', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        const fileC = createTempFile('c.md', '# File C', tmpDir);
        const fileB = createTempFile('b.md', `# File B\n@${fileC}`, tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);

        const graph = buildDependencyGraph([fileA, fileB, fileC]);
        const cycles = detectCircularDependencies(graph);

        assert.strictEqual(cycles.length, 0);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('detects multiple independent cycles', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-'));

      try {
        // Cycle 1: A ↔ B
        const fileB = createTempFile('b.md', '# File B (will ref A)', tmpDir);
        const fileA = createTempFile('a.md', `# File A\n@${fileB}`, tmpDir);
        fs.writeFileSync(fileB, `# File B\n@${fileA}`, 'utf-8');

        // Cycle 2: C ↔ D
        const fileD = createTempFile('d.md', '# File D (will ref C)', tmpDir);
        const fileC = createTempFile('c.md', `# File C\n@${fileD}`, tmpDir);
        fs.writeFileSync(fileD, `# File D\n@${fileC}`, 'utf-8');

        const graph = buildDependencyGraph([fileA, fileB, fileC, fileD]);
        const cycles = detectCircularDependencies(graph);

        assert.strictEqual(cycles.length, 2);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
