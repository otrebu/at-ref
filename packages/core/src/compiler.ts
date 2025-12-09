import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractReferences } from './parser';
import { resolvePath } from './resolver';
import type { AtReference, ResolveOptions } from './types';

/**
 * Options for compiling @ references
 */
export interface CompileOptions extends ResolveOptions {
  /** Output file path (default: input file with .built suffix) */
  outputPath?: string;
  /** Whether to write the output file (default: true) */
  writeOutput?: boolean;
  /** Custom wrapper for file content (default: XML tags) */
  contentWrapper?: (content: string, filePath: string, ref: AtReference) => string;
  /** Set of already visited file paths (for circular dependency detection) */
  _visitedFiles?: Set<string>;
}

/**
 * Result of a single reference compilation
 */
export interface CompiledReference {
  /** The original reference */
  reference: AtReference;
  /** The resolved file path */
  resolvedPath: string;
  /** Whether the file was found */
  found: boolean;
  /** The file content (if found) */
  content?: string;
  /** Error message (if not found) */
  error?: string;
  /** Whether this reference was skipped due to circular dependency */
  circular?: boolean;
}

/**
 * Result of compiling a file
 */
export interface CompileResult {
  /** Original file path */
  inputPath: string;
  /** Output file path */
  outputPath: string;
  /** The compiled content */
  compiledContent: string;
  /** All references that were processed */
  references: CompiledReference[];
  /** Number of successfully resolved references */
  successCount: number;
  /** Number of failed references */
  failedCount: number;
  /** Whether output was written */
  written: boolean;
}

/**
 * Get file extension for syntax highlighting
 */
function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const langMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.sql': 'sql',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.r': 'r',
    '.lua': 'lua',
    '.vim': 'vim',
    '.dockerfile': 'dockerfile',
    '.toml': 'toml',
    '.ini': 'ini',
    '.conf': 'conf',
  };
  return langMap[ext] || '';
}

/**
 * Default content wrapper - wraps in XML tags
 */
function defaultContentWrapper(content: string, filePath: string, _ref: AtReference): string {
  return `<file path="${filePath}">\n${content}\n</file>`;
}

/**
 * Generate output path with .built suffix
 */
export function getBuiltOutputPath(inputPath: string): string {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  return path.join(dir, `${base}.built${ext}`);
}

/**
 * Recursively compile content, resolving @references and their nested references
 */
function compileContentRecursive(
  content: string,
  currentFilePath: string,
  options: CompileOptions,
  visitedFiles: Set<string>
): { compiledContent: string; references: CompiledReference[] } {
  const {
    basePath = path.dirname(currentFilePath),
    contentWrapper = defaultContentWrapper,
    tryExtensions = [],
  } = options;

  const references = extractReferences(content);
  const compiledRefs: CompiledReference[] = [];

  // Sort references by startIndex in reverse order to replace from end to start
  // This ensures indices remain valid as we modify the string
  const sortedRefs = [...references].sort((a, b) => b.startIndex - a.startIndex);

  let compiledContent = content;

  for (const ref of sortedRefs) {
    const resolved = resolvePath(ref.path, { basePath, tryExtensions });

    const compiledRef: CompiledReference = {
      reference: ref,
      resolvedPath: resolved.resolvedPath,
      found: resolved.exists && !resolved.isDirectory,
    };

    // Check for circular dependency
    if (visitedFiles.has(resolved.resolvedPath)) {
      compiledRef.found = false;
      compiledRef.circular = true;
      compiledRef.error = `Circular dependency detected: ${resolved.resolvedPath}`;
      compiledRefs.push(compiledRef);
      continue;
    }

    if (resolved.exists && !resolved.isDirectory) {
      try {
        let fileContent = fs.readFileSync(resolved.resolvedPath, 'utf-8');

        // Add this file to visited set before recursing
        visitedFiles.add(resolved.resolvedPath);

        // Recursively compile the referenced file's content
        // Use the referenced file's directory as the new basePath
        const nestedResult = compileContentRecursive(
          fileContent,
          resolved.resolvedPath,
          {
            ...options,
            basePath: path.dirname(resolved.resolvedPath),
          },
          visitedFiles
        );

        // Use the recursively compiled content
        fileContent = nestedResult.compiledContent;
        compiledRef.content = fileContent;

        // Add nested references to our list
        compiledRefs.push(...nestedResult.references);

        const wrapped = contentWrapper(fileContent, resolved.resolvedPath, ref);
        compiledContent =
          compiledContent.slice(0, ref.startIndex) +
          wrapped +
          compiledContent.slice(ref.endIndex);
      } catch (err) {
        compiledRef.found = false;
        compiledRef.error = err instanceof Error ? err.message : 'Unknown error reading file';
      }
    } else if (resolved.isDirectory) {
      compiledRef.found = false;
      compiledRef.error = 'Path is a directory, not a file';
    } else {
      compiledRef.error = resolved.error || 'File not found';
    }

    compiledRefs.push(compiledRef);
  }

  // Reverse to get original order
  compiledRefs.reverse();

  return { compiledContent, references: compiledRefs };
}

/**
 * Compile a single file, resolving all @ references recursively
 */
export function compileFile(filePath: string, options: CompileOptions = {}): CompileResult {
  const {
    outputPath = getBuiltOutputPath(filePath),
    writeOutput = true,
    _visitedFiles = new Set<string>(),
  } = options;

  const absoluteInputPath = path.resolve(filePath);
  const content = fs.readFileSync(absoluteInputPath, 'utf-8');

  // Add the root file to visited set
  _visitedFiles.add(absoluteInputPath);

  // Use the file's directory as the base path for resolution
  const effectiveBasePath = options.basePath ?? path.dirname(absoluteInputPath);

  const { compiledContent, references: compiledRefs } = compileContentRecursive(
    content,
    absoluteInputPath,
    { ...options, basePath: effectiveBasePath },
    _visitedFiles
  );

  const successCount = compiledRefs.filter(r => r.found).length;
  const failedCount = compiledRefs.filter(r => !r.found).length;

  let written = false;
  if (writeOutput) {
    const absoluteOutputPath = path.resolve(outputPath);
    fs.writeFileSync(absoluteOutputPath, compiledContent, 'utf-8');
    written = true;
  }

  return {
    inputPath: absoluteInputPath,
    outputPath: path.resolve(outputPath),
    compiledContent,
    references: compiledRefs,
    successCount,
    failedCount,
    written,
  };
}

/**
 * Compile content string without file I/O (useful for VSCode extension)
 * Recursively resolves all @references including nested ones
 */
export function compileContent(
  content: string,
  options: CompileOptions = {}
): { compiledContent: string; references: CompiledReference[] } {
  const {
    basePath = process.cwd(),
    _visitedFiles = new Set<string>(),
  } = options;

  // Use the recursive compiler with a virtual file path based on basePath
  const virtualFilePath = path.join(basePath, '__virtual__.md');

  return compileContentRecursive(
    content,
    virtualFilePath,
    { ...options, basePath },
    _visitedFiles
  );
}
