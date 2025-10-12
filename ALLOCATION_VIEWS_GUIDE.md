# Resource Allocation Views - User Guide

## Overview
The Resource Allocation page now features three distinct views to help you manage allocations efficiently:

1. **Table View** - Detailed data grid with advanced filtering
2. **Timeline View** - Visual Gantt-style timeline with drag-and-drop
3. **Kanban View** - Board-style view for intuitive resource management

---

## 1. Table View (Original)

### Features
- Comprehensive table with all allocation details
- Advanced filtering by resource, project, domain, match score, etc.
- In-line editing and deletion
- Summary cards showing key metrics
- Cross-domain allocation tracking

### Best For
- Detailed data analysis
- Bulk filtering and searching
- Reviewing match scores and allocation percentages
- Export-ready data view

---

## 2. Timeline View (NEW)

### Layout
```
┌─────────────────┬──────────────────────────────────────────┐
│  Resources      │        Timeline (12 Months)              │
├─────────────────┼──────────────────────────────────────────┤
│ John Doe        │ [====Project A 50%====]                 │
│ 50% Available   │        [===Project B 25%===]            │
├─────────────────┼──────────────────────────────────────────┤
│ Jane Smith      │ [==========Project C 100%==========]    │
│ 0% Available    │                                          │
└─────────────────┴──────────────────────────────────────────┘

Available Projects Pool:
[Project D] [Project E] [Project F]
```

### How to Use

**Allocate Resources:**
1. Find a project in the "Available Projects" pool at the bottom
2. Drag the project card
3. Drop it onto a resource's timeline row
4. A quick dialog appears with smart defaults:
   - Duration: Auto-filled with project start/end dates
   - Allocation: Default 100%
   - Capability: Auto-selected best match
   - Requirement: Auto-matched to capability
5. Adjust values if needed and click "Allocate"

**Visual Indicators:**
- **Green bars**: Excellent match (80%+)
- **Yellow bars**: Good match (60-79%)
- **Red bars**: Poor match (<60%)
- **Grey bars**: No match data

**Capacity Management:**
- Each resource shows available capacity percentage
- Color-coded chips:
  - Green: >50% available
  - Yellow: 25-50% available
  - Red: Over 100% allocated

**Edit/Delete Allocations:**
- Hover over allocation bars to see action buttons
- Click Edit icon to modify
- Click Delete icon to remove

### Best For
- Visual capacity planning
- Quick drag-and-drop allocation
- Identifying scheduling conflicts
- Timeline-based project planning

---

## 3. Kanban View (NEW)

### Layout
```
┌─────────────────┬─────────────────┬─────────────────┐
│  Available      │   Allocated     │    Projects     │
│  Resources      │   Resources     │   Needing More  │
├─────────────────┼─────────────────┼─────────────────┤
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────┐ │
│ │ John Doe    │ │ │ Jane Smith  │ │ │ Project A   │ │
│ │ SAP/ABAP    │ │ │ → Project C │ │ │ Need: 2 Dev │ │
│ │ 75% Free    │ │ │   100%      │ │ │ Has: 1 Dev  │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────┘ │
└─────────────────┴─────────────────┴─────────────────┘
```

### How to Use

**Method 1: Drag Resource to Project Column**
1. Drag a resource card from "Available Resources"
2. Drop it in the "Projects Needing Resources" column
3. Quick allocation dialog appears
4. Select which project to assign
5. Confirm allocation

**Method 2: Drag Project to Resource Column**
1. Drag a project card from "Projects Needing Resources"
2. Drop it in "Available Resources" or "Allocated Resources" column
3. Quick allocation dialog appears
4. Select which resource to assign
5. Confirm allocation

**Method 3: Direct Card-to-Card Drag**
1. Drag a resource card
2. Drop it directly onto a project card (or vice versa)
3. Quick allocation dialog appears with both pre-selected
4. Confirm allocation

### Card Information

**Resource Cards:**
- Name and employee ID
- Domain affiliation
- Capacity bar (visual utilization)
- Top 3 skills/roles
- Color coding:
  - Green: Available resources (>0% free)
  - Grey: Fully allocated

**Allocated Resource Cards:**
- Shows all current allocations
- Allocation percentages
- Match scores with color indicators
- Project names

**Project Cards:**
- Project name and status
- Domain affiliation
- Requirements with fulfillment status
- Color coding:
  - Yellow: Needs more resources
  - Green: Fully staffed

### Best For
- High-level resource overview
- Quick allocation decisions
- Identifying under-staffed projects
- Team capacity at a glance

---

## Quick Allocation Dialog

### Smart Defaults
When you drag and drop, the dialog auto-fills:
- **Duration**: Uses project start/end dates by default
- **Allocation**: 100% by default
- **Capability**: Best matching skill from resource
- **Requirement**: Matching project requirement

### Customization Options
- **Allocation Percentage**: Slider from 1-100% (5% increments)
- **Allocation Type**: Shared, Dedicated, or On-Demand
- **Custom Duration**: Uncheck "Use full project duration" to set custom dates
- **Capability Selection**: Choose specific resource capability
- **Requirement Selection**: Choose specific project requirement

### Match Indicator
- **Green "Good Match"**: Resource capability matches project requirement
- **Yellow "Different Skill Set"**: Capability and requirement don't align

---

## Tips & Best Practices

### Timeline View Tips
- Allocations render as horizontal bars across months
- Longer bars = longer allocations
- Click month headers to jump to specific time periods
- Over-allocated resources show bars extending beyond 100%

### Kanban View Tips
- Available Resources column shows resources with spare capacity
- Allocated Resources column shows active assignments
- Projects column prioritizes under-staffed projects
- Cards update in real-time after allocation

### General Tips
- All views share the same underlying data
- Switch views anytime using the tabs at the top
- Filters from Table View apply to Timeline and Kanban
- Global domain/business decision filters work across all views
- Changes made in one view reflect in all other views

---

## Keyboard Shortcuts
- **Tab**: Switch between view tabs
- **Esc**: Close quick allocation dialog
- **Enter**: Confirm allocation (when dialog is open)

---

## Common Workflows

### Workflow 1: Allocate Resource to Multiple Projects
1. Go to **Timeline View**
2. Drag first project to resource row
3. Set allocation percentage (e.g., 50%)
4. Confirm
5. Drag second project to same resource
6. Set remaining percentage (e.g., 50%)
7. Confirm

### Workflow 2: Find Best Resource for Project
1. Go to **Kanban View**
2. Look at project card requirements
3. Find resource card with matching skills
4. Drag resource onto project card
5. Dialog shows match indicator
6. Confirm if good match

### Workflow 3: Review and Adjust Allocations
1. Go to **Table View** for detailed review
2. Filter by project or resource
3. Check match scores
4. Switch to **Timeline View** to see visual distribution
5. Drag to rebalance if needed

---

## Feature Comparison

| Feature | Table View | Timeline View | Kanban View |
|---------|------------|---------------|-------------|
| Detailed Data | ✅ | ❌ | ❌ |
| Visual Timeline | ❌ | ✅ | ❌ |
| Drag & Drop | ❌ | ✅ | ✅ |
| Capacity Overview | ✅ | ✅ | ✅ |
| Match Scores | ✅ | ✅ (color) | ✅ (color) |
| Filtering | ✅ | ✅ | ✅ |
| Quick Allocation | ❌ | ✅ | ✅ |
| Best For | Analysis | Planning | Assignment |

---

## Technical Implementation

### Dependencies Added
- `@dnd-kit/core`: Modern drag-and-drop library
- `@dnd-kit/sortable`: Sortable lists
- `@dnd-kit/utilities`: Helper utilities
- `date-fns`: Date manipulation for timeline

### Components Created
1. **QuickAllocationDialog.tsx**: Shared allocation dialog with smart defaults
2. **TimelineView.tsx**: Gantt-style timeline with drag-and-drop
3. **KanbanView.tsx**: Board-style view with three columns

### Key Features
- Accessible drag-and-drop (keyboard navigation supported)
- Real-time capacity calculations
- Visual feedback during drag operations
- Optimistic UI updates
- Match score calculation and display
- Cross-domain allocation support

---

## Future Enhancements (Potential)
- Undo/Redo for allocations
- Bulk allocation (drag multiple projects at once)
- Allocation templates/presets
- Timeline zoom levels (weeks, quarters, years)
- Export timeline as image
- Kanban swim lanes by domain
- Resource skill gap analysis
- Automated resource recommendations

---

For questions or issues, contact your system administrator.
