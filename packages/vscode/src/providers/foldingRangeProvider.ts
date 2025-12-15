import * as vscode from 'vscode';
import { calculateFoldingRanges } from '../utils/foldingLogic';

export class AtReferenceFoldingRangeProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    _context: vscode.FoldingContext,
    _token: vscode.CancellationToken
  ): vscode.FoldingRange[] {
    const ranges = calculateFoldingRanges(document.getText());
    return ranges.map(r => new vscode.FoldingRange(r.start, r.end, vscode.FoldingRangeKind.Region));
  }
}
