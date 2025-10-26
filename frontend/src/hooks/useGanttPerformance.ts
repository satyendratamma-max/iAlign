import { useState, useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  projectCount: number;
  renderTime: number;
  memoryUsageMB: number;
  fps: number;
  shouldUseVirtualScrolling: boolean;
  performanceLevel: 'good' | 'moderate' | 'poor';
}

/**
 * Hook to monitor Gantt chart performance and recommend virtual scrolling
 *
 * Usage:
 * ```tsx
 * const { metrics, startMeasure, endMeasure } = useGanttPerformance(filteredProjects);
 *
 * // In component
 * useEffect(() => {
 *   startMeasure();
 *   // ... render logic ...
 *   endMeasure();
 * }, [projects]);
 * ```
 */
export const useGanttPerformance = (projects: any[]) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    projectCount: 0,
    renderTime: 0,
    memoryUsageMB: 0,
    fps: 60,
    shouldUseVirtualScrolling: false,
    performanceLevel: 'good',
  });

  const renderStartTime = useRef<number>(0);
  const fpsFrames = useRef<number>(0);
  const lastFpsCheck = useRef<number>(Date.now());

  // Start performance measurement
  const startMeasure = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasure = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;

    // Estimate memory usage (approximate)
    const memoryUsageMB = (performance as any).memory
      ? (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      : 0;

    // Determine if virtual scrolling should be used
    const shouldUseVirtualScrolling =
      projects.length > 500 || // Large dataset
      renderTime > 1000 || // Slow render (> 1 second)
      memoryUsageMB > 100; // High memory usage

    // Performance level
    let performanceLevel: 'good' | 'moderate' | 'poor' = 'good';
    if (renderTime > 2000 || projects.length > 1000) {
      performanceLevel = 'poor';
    } else if (renderTime > 1000 || projects.length > 500) {
      performanceLevel = 'moderate';
    }

    setMetrics({
      projectCount: projects.length,
      renderTime,
      memoryUsageMB,
      fps: metrics.fps,
      shouldUseVirtualScrolling,
      performanceLevel,
    });
  }, [projects.length, metrics.fps]);

  // Monitor FPS
  useEffect(() => {
    let animationFrameId: number;

    const checkFPS = () => {
      fpsFrames.current++;
      const now = Date.now();
      const elapsed = now - lastFpsCheck.current;

      if (elapsed >= 1000) {
        const fps = (fpsFrames.current / elapsed) * 1000;
        setMetrics((prev) => ({ ...prev, fps: Math.round(fps) }));
        fpsFrames.current = 0;
        lastFpsCheck.current = now;
      }

      animationFrameId = requestAnimationFrame(checkFPS);
    };

    animationFrameId = requestAnimationFrame(checkFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure,
  };
};

/**
 * Format performance metrics for display
 */
export const formatPerformanceMetrics = (metrics: PerformanceMetrics): string => {
  return `
Projects: ${metrics.projectCount}
Render Time: ${metrics.renderTime.toFixed(0)}ms
Memory: ${metrics.memoryUsageMB.toFixed(1)}MB
FPS: ${metrics.fps}
Performance: ${metrics.performanceLevel.toUpperCase()}
${metrics.shouldUseVirtualScrolling ? '⚠️ Virtual scrolling recommended' : '✅ Performance optimal'}
  `.trim();
};
