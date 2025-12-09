import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractReferences } from './parser';
import { resolvePath } from './resolver';
import type { ResolveOptions } from './types';

/**
 * Error types that can occur during graph building
 */
export type GraphErrorType = 'circular' | 'missing' | 'parse';

/**
 * Error encountered during graph building
 */
export interface GraphError {
  type: GraphErrorType;
  filePath: string;
  cycle?: string[];
  missingDep?: string;
  message: string;
}

/**
 * Node in the dependency graph
 */
export interface DependencyNode {
  /** Absolute file path */
  filePath: string;
  /** Files this node depends on (absolute paths) */
  dependencies: Set<string>;
  /** Files that depend on this node (absolute paths) */
  dependents: Set<string>;
}

/**
 * Dependency graph of markdown files
 */
export interface DependencyGraph {
  /** Map of file path to dependency node */
  nodes: Map<string, DependencyNode>;
  /** Files with no dependencies (leaf nodes) */
  rootFiles: Set<string>;
  /** Errors encountered during graph building */
  errors: GraphError[];
}

/**
 * Build a dependency graph from a list of markdown files
 */
export function buildDependencyGraph(
  files: string[],
  options: ResolveOptions = {}
): DependencyGraph {
  const nodes = new Map<string, DependencyNode>();
  const errors: GraphError[] = [];
  const fileSet = new Set(files.map(f => path.resolve(f)));

  // Initialize nodes for all files
  for (const file of files) {
    const absolutePath = path.resolve(file);
    nodes.set(absolutePath, {
      filePath: absolutePath,
      dependencies: new Set(),
      dependents: new Set()
    });
  }

  // Build dependency edges
  for (const file of files) {
    const absolutePath = path.resolve(file);
    const node = nodes.get(absolutePath)!;

    try {
      // Read file content
      if (!fs.existsSync(absolutePath)) {
        errors.push({
          type: 'missing',
          filePath: absolutePath,
          message: `File not found: ${absolutePath}`
        });
        continue;
      }

      const content = fs.readFileSync(absolutePath, 'utf-8');

      // Extract references
      const references = extractReferences(content);

      // Resolve each reference
      for (const ref of references) {
        const resolved = resolvePath(ref.path, {
          basePath: path.dirname(absolutePath),
          tryExtensions: options.tryExtensions
        });

        if (!resolved.exists) {
          errors.push({
            type: 'missing',
            filePath: absolutePath,
            missingDep: ref.path,
            message: `Missing dependency in ${path.basename(absolutePath)}: ${ref.path}`
          });
          continue;
        }

        const depPath = resolved.resolvedPath;

        // Add dependency edge
        node.dependencies.add(depPath);

        // If dependency is in our file set, add reverse edge
        if (fileSet.has(depPath)) {
          const depNode = nodes.get(depPath);
          if (depNode) {
            depNode.dependents.add(absolutePath);
          }
        }
      }
    } catch (error) {
      errors.push({
        type: 'parse',
        filePath: absolutePath,
        message: `Parse error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // Identify root files (only considering dependencies within the file set)
  const rootFiles = new Set<string>();
  for (const [filePath, node] of nodes) {
    // Root = no dependencies OR all dependencies are external
    const internalDeps = Array.from(node.dependencies).filter(dep => fileSet.has(dep));
    if (internalDeps.length === 0) {
      rootFiles.add(filePath);
    }
  }

  return { nodes, rootFiles, errors };
}

/**
 * Topologically sort files using Kahn's algorithm
 * Returns sorted order (dependencies before dependents) and any cycles detected
 */
export function topologicalSort(graph: DependencyGraph): {
  sorted: string[];
  cycles: string[][];
} {
  const sorted: string[] = [];
  const inDegree = new Map<string, number>();
  const fileSet = new Set(graph.nodes.keys());

  // Calculate in-degree (only counting dependencies within the graph)
  for (const [filePath, node] of graph.nodes) {
    const internalDeps = Array.from(node.dependencies).filter(dep => fileSet.has(dep));
    inDegree.set(filePath, internalDeps.length);
  }

  // Queue of nodes with zero in-degree
  const queue: string[] = [];
  for (const [filePath, degree] of inDegree) {
    if (degree === 0) {
      queue.push(filePath);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const filePath = queue.shift()!;
    sorted.push(filePath);

    const node = graph.nodes.get(filePath)!;

    // Reduce in-degree of dependents
    for (const dependent of node.dependents) {
      if (!fileSet.has(dependent)) continue;

      const currentDegree = inDegree.get(dependent)!;
      const newDegree = currentDegree - 1;
      inDegree.set(dependent, newDegree);

      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // If nodes remain, there are cycles
  const cycles: string[][] = [];
  if (sorted.length < graph.nodes.size) {
    // Find cycles using remaining nodes
    const remaining = Array.from(graph.nodes.keys()).filter(
      f => !sorted.includes(f)
    );
    const cycleSet = detectCircularDependencies(graph);
    cycles.push(...cycleSet);

    // Add remaining files to sorted (best-effort ordering)
    sorted.push(...remaining);
  }

  return { sorted, cycles };
}

/**
 * Detect circular dependencies using Tarjan's strongly connected components algorithm
 */
export function detectCircularDependencies(graph: DependencyGraph): string[][] {
  const fileSet = new Set(graph.nodes.keys());
  const index = new Map<string, number>();
  const lowLink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];
  let currentIndex = 0;

  function strongConnect(filePath: string) {
    index.set(filePath, currentIndex);
    lowLink.set(filePath, currentIndex);
    currentIndex++;
    stack.push(filePath);
    onStack.add(filePath);

    const node = graph.nodes.get(filePath)!;

    // Consider only dependencies within the graph
    const internalDeps = Array.from(node.dependencies).filter(dep => fileSet.has(dep));

    for (const dep of internalDeps) {
      if (!index.has(dep)) {
        strongConnect(dep);
        lowLink.set(filePath, Math.min(lowLink.get(filePath)!, lowLink.get(dep)!));
      } else if (onStack.has(dep)) {
        lowLink.set(filePath, Math.min(lowLink.get(filePath)!, index.get(dep)!));
      }
    }

    // Root of SCC
    if (lowLink.get(filePath) === index.get(filePath)) {
      const component: string[] = [];
      let w: string;

      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.push(w);
      } while (w !== filePath);

      // Only record if it's a cycle (size > 1) or self-loop
      if (component.length > 1 || node.dependencies.has(filePath)) {
        sccs.push(component);
      }
    }
  }

  // Run Tarjan's for all unvisited nodes
  for (const filePath of graph.nodes.keys()) {
    if (!index.has(filePath)) {
      strongConnect(filePath);
    }
  }

  return sccs;
}
