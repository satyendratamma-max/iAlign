import { useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { Box } from '@mui/material';

interface Project {
  id: number;
  name: string;
  projectNumber?: string;
  status?: string;
  progress?: number;
  healthStatus?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  desiredStartDate?: string | Date;
  desiredCompletionDate?: string | Date;
  [key: string]: any;
}

interface VirtualGanttTimelineProps {
  /** All filtered projects */
  projects: Project[];
  /** Height of each project row in pixels */
  rowHeight?: number;
  /** Container height */
  height: number;
  /** Container width */
  width: number;
  /** Number of rows to render outside visible area (buffer) */
  overscanCount?: number;
  /** Render function for each project row */
  renderProjectRow: (props: {
    project: Project;
    index: number;
    style: React.CSSProperties;
  }) => React.ReactNode;
  /** Optional swimlane structure for grouped rendering */
  swimlaneStructure?: SwimlaneStructure | null;
  /** Swimlane configuration */
  swimlaneConfig?: {
    enabled: boolean;
    level1: string;
    level2: string;
    level2Enabled: boolean;
    rotateLevel1: boolean;
    rotateLevel2: boolean;
  };
  /** Callback when visible range changes */
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  /** Callback when scroll offset changes */
  onScrollOffsetChange?: (scrollOffset: number) => void;
}

interface SwimlaneStructure {
  [level1Key: string]: {
    [level2Key: string]: Project[];
  };
}

export interface VirtualGanttTimelineHandle {
  /** Scroll to a specific project by ID */
  scrollToProject: (projectId: number) => void;
  /** Get currently visible project IDs */
  getVisibleProjectIds: () => number[];
}

const VirtualGanttTimeline = forwardRef<VirtualGanttTimelineHandle, VirtualGanttTimelineProps>(
  (
    {
      projects,
      rowHeight = 37,
      height,
      width,
      overscanCount = 10,
      renderProjectRow,
      swimlaneStructure,
      swimlaneConfig,
      onVisibleRangeChange,
      onScrollOffsetChange,
    },
    ref
  ) => {
    const listRef = useRef<List | null>(null);
    const visibleRangeRef = useRef({ start: 0, end: 0 });

    // Build flat project list for rendering (maintains order)
    const flatProjects = useMemo(() => {
      if (!swimlaneConfig?.enabled || !swimlaneStructure) {
        return projects;
      }

      // Flatten swimlane structure while maintaining grouping order
      const flat: Project[] = [];
      Object.entries(swimlaneStructure).forEach(([_, level2Groups]) => {
        Object.entries(level2Groups).forEach(([__, projectList]) => {
          flat.push(...projectList);
        });
      });
      return flat;
    }, [projects, swimlaneStructure, swimlaneConfig]);

    // Create project ID to index map for quick lookup
    const projectIdToIndexMap = useMemo(() => {
      const map = new Map<number, number>();
      flatProjects.forEach((project, index) => {
        map.set(project.id, index);
      });
      return map;
    }, [flatProjects]);

    // Get visible project IDs
    const getVisibleProjectIds = useCallback((): number[] => {
      const { start, end } = visibleRangeRef.current;
      const visibleProjects = flatProjects.slice(start, end + 1);
      return visibleProjects.map((p) => p.id);
    }, [flatProjects]);

    // Scroll to specific project
    const scrollToProject = useCallback(
      (projectId: number) => {
        const index = projectIdToIndexMap.get(projectId);
        if (index !== undefined && listRef.current) {
          listRef.current.scrollToItem(index, 'center');
        }
      },
      [projectIdToIndexMap]
    );

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        scrollToProject,
        getVisibleProjectIds,
      }),
      [scrollToProject, getVisibleProjectIds]
    );

    // Handle visible range updates
    const handleItemsRendered = useCallback(
      ({
        visibleStartIndex,
        visibleStopIndex,
      }: {
        visibleStartIndex: number;
        visibleStopIndex: number;
      }) => {
        visibleRangeRef.current = {
          start: visibleStartIndex,
          end: visibleStopIndex,
        };

        if (onVisibleRangeChange) {
          onVisibleRangeChange(visibleStartIndex, visibleStopIndex);
        }
      },
      [onVisibleRangeChange]
    );

    // Handle scroll position updates
    const handleScroll = useCallback(
      ({ scrollOffset }: { scrollOffset: number }) => {
        if (onScrollOffsetChange) {
          onScrollOffsetChange(scrollOffset);
        }
      },
      [onScrollOffsetChange]
    );

    if (flatProjects.length === 0) {
      console.warn('[VirtualGanttTimeline] No projects to display');
      return (
        <Box
          sx={{
            height,
            width,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          No projects to display
        </Box>
      );
    }

    // Row renderer - receives props from react-window v1
    const Row = useCallback(
      ({ index, style }: ListChildComponentProps) => {
        const project = flatProjects[index];

        if (!project) {
          console.warn('[VirtualGanttTimeline] No project at index:', index);
          return <div style={style}>No project</div>;
        }

        return (
          <div style={style}>
            {renderProjectRow({ project, index, style })}
          </div>
        );
      },
      [flatProjects, renderProjectRow]
    );

    // Use react-window v1 FixedSizeList component
    return (
      <List
        ref={listRef}
        height={height}
        itemCount={flatProjects.length}
        itemSize={rowHeight}
        width={width}
        overscanCount={overscanCount}
        onItemsRendered={handleItemsRendered}
        onScroll={handleScroll}
      >
        {Row}
      </List>
    );
  }
);

VirtualGanttTimeline.displayName = 'VirtualGanttTimeline';

export default VirtualGanttTimeline;
