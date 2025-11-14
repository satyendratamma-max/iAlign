import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { useLocation, useNavigate, UNSAFE_NavigationContext } from 'react-router-dom';

/**
 * Hook to track unsaved changes and prevent navigation
 *
 * Works with BrowserRouter (doesn't require data router)
 *
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param message - Custom warning message (optional)
 * @returns Object with showPrompt and navigation control functions
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
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isNavigationConfirmed, setIsNavigationConfirmed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navigationContext = useRef<any>(null);

  // Get the navigation context to intercept navigation
  // @ts-ignore - Accessing internal context
  const navContext = useContext(UNSAFE_NavigationContext);
  navigationContext.current = navContext;

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

  // Block browser back/forward navigation
  useEffect(() => {
    if (!hasUnsavedChanges || isNavigationConfirmed) return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Store where we want to go
      const currentPath = window.location.pathname;
      setPendingNavigation(currentPath);
      setShowPrompt(true);

      // Push current state back to stay on page
      window.history.pushState(null, '', location.pathname);
    };

    // Add a dummy state to prevent immediate back
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, isNavigationConfirmed, location.pathname]);

  // Intercept React Router navigation (in-app links)
  useEffect(() => {
    if (!hasUnsavedChanges || isNavigationConfirmed || !navigationContext.current) return;

    const { navigator } = navigationContext.current;
    if (!navigator) return;

    // Store original push function
    const originalPush = navigator.push;
    const originalReplace = navigator.replace;

    // Override push to show confirmation
    navigator.push = (...args: any[]) => {
      const targetPath = typeof args[0] === 'string' ? args[0] : args[0].pathname;

      // If trying to navigate to different path, show prompt
      if (targetPath !== location.pathname) {
        setPendingNavigation(targetPath);
        setShowPrompt(true);
      } else {
        originalPush.apply(navigator, args);
      }
    };

    // Override replace similarly
    navigator.replace = (...args: any[]) => {
      const targetPath = typeof args[0] === 'string' ? args[0] : args[0].pathname;

      if (targetPath !== location.pathname) {
        setPendingNavigation(targetPath);
        setShowPrompt(true);
      } else {
        originalReplace.apply(navigator, args);
      }
    };

    return () => {
      // Restore original functions
      navigator.push = originalPush;
      navigator.replace = originalReplace;
    };
  }, [hasUnsavedChanges, isNavigationConfirmed, location.pathname]);

  // Confirm navigation - proceed with pending navigation
  const confirmNavigation = useCallback(() => {
    setShowPrompt(false);
    setIsNavigationConfirmed(true); // Bypass blocking

    if (pendingNavigation) {
      // Navigate to the pending path
      setTimeout(() => {
        navigate(pendingNavigation);
        setPendingNavigation(null);
        setIsNavigationConfirmed(false); // Reset for next time
      }, 0);
    }
  }, [pendingNavigation, navigate]);

  // Cancel navigation - stay on current page
  const cancelNavigation = useCallback(() => {
    setShowPrompt(false);
    setPendingNavigation(null);
  }, []);

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
