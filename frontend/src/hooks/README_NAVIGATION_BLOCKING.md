# Browser Navigation Blocking Guide

This guide explains how to implement browser back/forward navigation support with unsaved changes warning across pages.

## Overview

The navigation blocking system consists of:
1. **`useUnsavedChanges` hook** - Tracks unsaved changes and blocks navigation
2. **`NavigationPrompt` component** - Displays warning dialog
3. **Integration pattern** - How to use them in your pages

## Features

- ✅ Blocks browser back/forward navigation when there are unsaved changes
- ✅ Warns on page refresh/close (beforeunload event)
- ✅ Shows confirmation dialog before leaving
- ✅ Works with React Router v6

## How to Implement

### 1. Import the Hook and Component

```typescript
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import NavigationPrompt from '../../components/common/NavigationPrompt';
```

### 2. Add State to Track Unsaved Changes

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

### 3. Use the Hook

```typescript
const { showPrompt, confirmNavigation, cancelNavigation, message } = useUnsavedChanges(
  hasUnsavedChanges,  // Condition when navigation should be blocked
  'You have unsaved changes. Are you sure you want to leave this page?' // Custom message
);
```

### 4. Create Helper Function to Update State

```typescript
// Helper to update form data and mark as unsaved
const updateFormData = (updates: Partial<YourDataType>) => {
  setFormData({ ...formData, ...updates });
  setHasUnsavedChanges(true);
};
```

### 5. Reset on Save/Close

```typescript
const handleSave = async () => {
  try {
    // ... save logic ...
    setHasUnsavedChanges(false); // Reset after successful save
    handleClose();
  } catch (error) {
    // Handle error
  }
};

const handleClose = () => {
  setOpenDialog(false);
  setHasUnsavedChanges(false); // Reset on close
};
```

### 6. Add NavigationPrompt Component

Add this component at the end of your return statement, before the closing tag:

```typescript
return (
  <Box>
    {/* Your page content */}

    {/* Navigation Prompt - Warn when leaving with unsaved changes */}
    <NavigationPrompt
      open={showPrompt}
      message={message}
      onConfirm={confirmNavigation}
      onCancel={cancelNavigation}
    />
  </Box>
);
```

## Complete Example

```typescript
import React, { useState } from 'react';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import NavigationPrompt from '../../components/common/NavigationPrompt';

const MyFormPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Navigation blocking hook
  const { showPrompt, confirmNavigation, cancelNavigation, message } = useUnsavedChanges(
    openDialog && hasUnsavedChanges,
    'You have unsaved changes. Are you sure you want to leave?'
  );

  // Helper to update form and mark as unsaved
  const updateFormData = (updates) => {
    setFormData({ ...formData, ...updates });
    setHasUnsavedChanges(true);
  };

  const handleOpen = () => {
    setOpenDialog(true);
    setHasUnsavedChanges(false); // Reset on open
  };

  const handleClose = () => {
    setOpenDialog(false);
    setHasUnsavedChanges(false); // Reset on close
  };

  const handleSave = async () => {
    try {
      // Save logic here
      await saveData(formData);
      handleClose(); // This will reset hasUnsavedChanges
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <Box>
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogContent>
          <TextField
            value={formData.name || ''}
            onChange={(e) => updateFormData({ name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Navigation Prompt */}
      <NavigationPrompt
        open={showPrompt}
        message={message}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </Box>
  );
};
```

## Pages Already Implemented

- ✅ **ProjectManagement** (`/projects`) - Full implementation with all form fields

## Recommended Pages to Implement Next

Pages with forms/dialogs that should have navigation blocking:

1. **Resource Allocation** (`/resources/allocation`) - When editing allocations
2. **Resource Overview** (`/resource-overview`) - When editing resources
3. **Milestone Tracker** (`/projects/:projectId/milestones`) - When editing milestones
4. **Project Requirements** (`/projects/:projectId/requirements`) - When editing requirements
5. **Domain Portfolio Overview** - When editing domains/portfolios
6. **Admin Pages** - Access Provisioning, Data Management, etc.

## Notes

- The hook automatically handles browser refresh/close with beforeunload
- The hook only blocks when BOTH conditions are true: dialog is open AND form has unsaved changes
- The NavigationPrompt component uses Material-UI Dialog for consistent styling
- Browser back/forward buttons will trigger the warning dialog
- In-app navigation via React Router will also trigger the warning

## Testing

1. Open a form dialog
2. Make changes to any field
3. Try to navigate away using:
   - Browser back button
   - Browser forward button (if there's forward history)
   - Clicking a different page link
   - Refreshing the page
   - Closing the browser tab
4. Verify warning dialog appears
5. Test both "Stay on Page" and "Leave Page" options
