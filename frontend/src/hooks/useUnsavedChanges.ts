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
  const [pendingAction, setPendingAction] = useState<'back' | 'forward' | 'navigate' | null>(null);
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

    const currentUrl = location.pathname + location.search;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // User clicked browser back or forward
      setPendingAction('back'); // Assume back for now (can't easily detect forward)
      setShowPrompt(true);

      // Push current state back to stay on page (preserve search params)
      window.history.pushState(null, '', currentUrl);
    };

    // Add a dummy state to prevent immediate back (preserve search params)
    window.history.pushState(null, '', currentUrl);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, isNavigationConfirmed, location.pathname, location.search]);

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
        setPendingAction('navigate');
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
        setPendingAction('navigate');
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
    setPendingNavigation(null);
    setPendingAction(null);

    // Set confirmed flag FIRST, then navigate after a delay to ensure React updates
    setIsNavigationConfirmed(true);

    setTimeout(() => {
      if (pendingAction === 'back') {
        // User clicked browser back
        // Go back 2 steps to skip past the dummy state we pushed when blocking
        window.history.go(-2);
      } else if (pendingAction === 'forward') {
        // User clicked browser forward
        window.history.forward();
      } else if (pendingAction === 'navigate' && pendingNavigation) {
        // User clicked in-app link
        navigate(pendingNavigation);
      }

      // Reset after navigation completes
      setTimeout(() => setIsNavigationConfirmed(false), 100);
    }, 50);
  }, [pendingAction, pendingNavigation, navigate]);

  // Cancel navigation - stay on current page
  const cancelNavigation = useCallback(() => {
    setShowPrompt(false);
    setPendingNavigation(null);
    setPendingAction(null);
  }, []);

  return {
    showPrompt,
    confirmNavigation,
    cancelNavigation,
    message,
  };
}
