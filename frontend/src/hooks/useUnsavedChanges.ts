import { useEffect, useState, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Hook to track unsaved changes and prevent navigation
 *
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param message - Custom warning message (optional)
 * @returns Object with proceed and reset functions for the confirmation dialog
 *
 * @example
 * const { showPrompt, confirmNavigation, cancelNavigation } = useUnsavedChanges(
 *   isFormDirty,
 *   'You have unsaved changes. Are you sure you want to leave?'
 * );
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave this page?'
) {
  const [showPrompt, setShowPrompt] = useState(false);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle browser refresh/close with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // Show confirmation dialog when navigation is blocked
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowPrompt(true);
    }
  }, [blocker.state]);

  // Confirm navigation - proceed with blocked navigation
  const confirmNavigation = useCallback(() => {
    setShowPrompt(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  // Cancel navigation - stay on current page
  const cancelNavigation = useCallback(() => {
    setShowPrompt(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
