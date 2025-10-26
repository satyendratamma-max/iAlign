import { useCallback } from 'react';
import { Box } from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';
import VirtualGanttTimeline, { VirtualGanttTimelineHandle } from './VirtualGanttTimeline';

interface Project {
  id: number;
  name: string;
  projectNumber?: string;
  status: string;
  priority?: string;
  progress: number;
  healthStatus?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  desiredStartDate?: string | Date;
  desiredCompletionDate?: string | Date;
  isActive?: boolean;
  [key: string]: any;
}

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  plannedEndDate?: string | Date;
  status?: string;
  [key: string]: any;
}

interface VirtualGanttFlatListProps {
  projects: Project[];
  milestones: Milestone[];
  ganttSidebarWidth: number;
  dateRange: { start: Date; end: Date };
  cpmData: { nodes: Map<string, any>; criticalPath: string[] };
  tempPositions: any;
  draggingItem: any;
  calculatePosition: (date: Date | undefined, rangeStart: Date, rangeEnd: Date) => number;
  calculateWidth: (startDate: Date | undefined, endDate: Date | undefined, rangeStart: Date, rangeEnd: Date) => number;
  getStatusColor: (status: string) => string;
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  renderProjectRow: (props: {
    project: Project;
    projectMilestones: Milestone[];
    projectStart: string | Date | undefined;
    projectEnd: string | Date | undefined;
    ganttSidebarWidth: number;
    dateRange: { start: Date; end: Date };
    cpmData: { nodes: Map<string, any>; criticalPath: string[] };
    tempPositions: any;
    draggingItem: any;
    calculatePosition: (date: Date | undefined, rangeStart: Date, rangeEnd: Date) => number;
    calculateWidth: (startDate: Date | undefined, endDate: Date | undefined, rangeStart: Date, rangeEnd: Date) => number;
    getStatusColor: (status: string) => string;
  }) => React.ReactNode;
  virtualGanttRef?: React.RefObject<VirtualGanttTimelineHandle>;
}

const VirtualGanttFlatList: React.FC<VirtualGanttFlatListProps> = ({
  projects,
  milestones,
  ganttSidebarWidth,
  dateRange,
  cpmData,
  tempPositions,
  draggingItem,
  calculatePosition,
  calculateWidth,
  getStatusColor,
  onVisibleRangeChange,
  renderProjectRow,
  virtualGanttRef,
}) => {
  // Render function for each project row
  const handleRenderProjectRow = useCallback(
    (props: { project: Project; index: number; style: React.CSSProperties }) => {
      const { project, style } = props;
      const projectMilestones = milestones.filter((m) => m.projectId === project.id);
      const projectStart = project.startDate || project.desiredStartDate;
      const projectEnd = project.endDate || project.desiredCompletionDate;

      console.log('[VirtualGanttFlatList] Row render:', {
        index: props.index,
        projectId: project.id,
        projectName: project.name,
        projectStart,
        projectEnd,
        projectStartType: typeof projectStart,
        projectEndType: typeof projectEnd,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        milestonesCount: projectMilestones.length,
        style,
      });

      return (
        <div style={style}>
          {renderProjectRow({
            project,
            projectMilestones,
            projectStart,
            projectEnd,
            ganttSidebarWidth,
            dateRange,
            cpmData,
            tempPositions,
            draggingItem,
            calculatePosition,
            calculateWidth,
            getStatusColor,
          })}
        </div>
      );
    },
    [
      milestones,
      ganttSidebarWidth,
      dateRange,
      cpmData,
      tempPositions,
      draggingItem,
      calculatePosition,
      calculateWidth,
      getStatusColor,
      renderProjectRow,
    ]
  );

  console.log('[VirtualGanttFlatList] Render called:', {
    projectCount: projects.length,
    milestonesCount: milestones.length,
  });

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <AutoSizer>
        {({ height, width }) => {
          console.log('[VirtualGanttFlatList] AutoSizer dimensions:', { height, width });
          return (
            <VirtualGanttTimeline
              ref={virtualGanttRef}
              projects={projects}
              rowHeight={37}
              height={height}
              width={width}
              overscanCount={10}
              renderProjectRow={handleRenderProjectRow as any}
              onVisibleRangeChange={onVisibleRangeChange}
            />
          );
        }}
      </AutoSizer>
    </Box>
  );
};

export default VirtualGanttFlatList;
