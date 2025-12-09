import type { CompiledReference } from './compiler';
import type { AtReference } from './types';

/**
 * Node in the reference tree
 */
export interface TreeNode {
  /** The reference that created this node */
  reference: AtReference;
  /** Resolved file path */
  filePath: string;
  /** Whether the file was found */
  found: boolean;
  /** Error message if not found */
  error?: string;
  /** Whether this is a circular reference */
  circular?: boolean;
  /** Import count (how many times this file is imported) */
  importCount: number;
  /** First parent that imported this file */
  firstImportedFrom?: string;
  /** Nested references (children) */
  children: TreeNode[];
  /** Depth in tree (for indentation) */
  depth: number;
  /** Whether this was a reference-only import (optimized) */
  optimized?: boolean;
}

/**
 * Build tree structure from flat reference list
 */
export function buildReferenceTree(
  references: CompiledReference[],
  rootPath: string
): TreeNode[] {
  // Group references by their parent (importedFrom)
  const childrenByParent = new Map<string, CompiledReference[]>();

  for (const ref of references) {
    const parent = ref.importedFrom || rootPath;
    if (!childrenByParent.has(parent)) {
      childrenByParent.set(parent, []);
    }
    childrenByParent.get(parent)!.push(ref);
  }

  // Recursively build tree nodes
  function buildNode(
    ref: CompiledReference,
    depth: number,
    seenFiles: Map<string, string> // file -> first parent
  ): TreeNode {
    const firstSeen = seenFiles.get(ref.resolvedPath);
    if (!firstSeen) {
      seenFiles.set(ref.resolvedPath, ref.importedFrom || rootPath);
    }

    const children = childrenByParent.get(ref.resolvedPath) || [];

    // Check if this was an optimized import (empty content means it was a reference tag)
    const optimized = ref.found && ref.content === '';

    return {
      reference: ref.reference,
      filePath: ref.resolvedPath,
      found: ref.found,
      error: ref.error,
      circular: ref.circular,
      importCount: ref.importCount || 1,
      firstImportedFrom: firstSeen,
      children: children.map(child => buildNode(child, depth + 1, seenFiles)),
      depth,
      optimized
    };
  }

  // Start with root-level references
  const rootRefs = childrenByParent.get(rootPath) || [];
  const seenFiles = new Map<string, string>();

  return rootRefs.map(ref => buildNode(ref, 0, seenFiles));
}

/**
 * Format tree with Unicode box characters and colors
 */
export function formatTree(
  nodes: TreeNode[],
  options: {
    noColor?: boolean;
    showFullPaths?: boolean;
  } = {}
): string {
  const { noColor = false, showFullPaths = false } = options;

  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
  };

  const c = noColor
    ? { reset: '', green: '', red: '', yellow: '', cyan: '', dim: '' }
    : colors;

  const lines: string[] = [];

  function formatNode(node: TreeNode, prefix: string, isLast: boolean) {
    // Tree characters
    const branch = isLast ? '└─ ' : '├─ ';
    const verticalLine = '│  ';
    const emptySpace = '   ';

    // Status indicator and color
    let status = '';
    let color = c.green;

    if (node.circular) {
      status = ` ${c.red}⚠️  (circular)${c.reset}`;
      color = c.red;
    } else if (!node.found) {
      status = ` ${c.red}✗${c.reset}`;
      color = c.red;
    } else if (node.optimized) {
      status = ` ${c.cyan}→ (reference)${c.reset}`;
      color = c.cyan;
    } else if (node.importCount > 1 && node.firstImportedFrom) {
      status = ` ${c.yellow}⚠️  (duplicate)${c.reset}`;
      color = c.yellow;
    }

    // File path (relative or absolute)
    const displayPath = showFullPaths
      ? node.filePath
      : node.reference.path;

    // Format line
    const line = `${prefix}${branch}${color}${node.reference.raw}${c.reset}${status}`;

    lines.push(line);

    // Error details
    if (node.error && !node.circular) {
      const errorPrefix = prefix + (isLast ? emptySpace : verticalLine);
      lines.push(`${errorPrefix}   ${c.red}${node.error}${c.reset}`);
    }

    // Render children
    node.children.forEach((child, index) => {
      const isLastChild = index === node.children.length - 1;
      const childPrefix = prefix + (isLast ? emptySpace : verticalLine);
      formatNode(child, childPrefix, isLastChild);
    });
  }

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    formatNode(node, '', isLast);
  });

  return lines.join('\n');
}
