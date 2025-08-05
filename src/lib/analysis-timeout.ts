// Analysis timeout management utilities

export const ANALYSIS_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (increased for comprehensive analysis)
export const CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export interface AnalysisTimeout {
  analysisId: string;
  timeoutId: NodeJS.Timeout;
  startTime: number;
}

// In-memory tracking of active analyses
const activeAnalyses = new Map<string, AnalysisTimeout>();

export function startAnalysisTimeout(
  analysisId: string, 
  onTimeout: () => Promise<void>
): void {
  // Clear any existing timeout for this analysis
  stopAnalysisTimeout(analysisId);
  
  const timeoutId = setTimeout(async () => {
    console.log(`Analysis ${analysisId} timed out after ${ANALYSIS_TIMEOUT_MS}ms`);
    activeAnalyses.delete(analysisId);
    await onTimeout();
  }, ANALYSIS_TIMEOUT_MS);
  
  activeAnalyses.set(analysisId, {
    analysisId,
    timeoutId,
    startTime: Date.now()
  });
  
  console.log(`Started timeout for analysis ${analysisId}`);
}

export function stopAnalysisTimeout(analysisId: string): void {
  const analysis = activeAnalyses.get(analysisId);
  if (analysis) {
    clearTimeout(analysis.timeoutId);
    activeAnalyses.delete(analysisId);
    console.log(`Stopped timeout for analysis ${analysisId}`);
  }
}

export function getActiveAnalysesCount(): number {
  return activeAnalyses.size;
}

export function getActiveAnalyses(): string[] {
  return Array.from(activeAnalyses.keys());
}

// Cleanup function to handle any analyses that might have been missed
export async function cleanupStuckAnalyses(): Promise<number> {
  try {
    const response = await fetch('/api/cleanup-stuck-analyses', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.cleanedCount || 0;
    }
  } catch (error) {
    console.error('Failed to cleanup stuck analyses:', error);
  }
  return 0;
}

// Start periodic cleanup (should be called once when server starts)
let cleanupIntervalId: NodeJS.Timeout | null = null;

export function startPeriodicCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }
  
  cleanupIntervalId = setInterval(async () => {
    const cleaned = await cleanupStuckAnalyses();
    if (cleaned > 0) {
      console.log(`Periodic cleanup: cleaned ${cleaned} stuck analyses`);
    }
  }, CLEANUP_INTERVAL_MS);
  
  console.log('Started periodic analysis cleanup');
}

export function stopPeriodicCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log('Stopped periodic analysis cleanup');
  }
}