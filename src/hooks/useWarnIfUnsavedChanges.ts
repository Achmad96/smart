import { useEffect } from 'react';

export function useWarnIfUnsavedChanges(
  isDirty: boolean,
  warningText = "You have unsaved changes. Are you sure you want to leave?"
) {
  useEffect(() => {
    if (!isDirty) return;

    // Handle window close or refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = warningText;
      return warningText;
    };
    
    // Handle internal Next.js navigation via <Link>
    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as Element).closest('a');
      if (target && target.href) {
        try {
          const targetUrl = new URL(target.href);
          const currentUrl = new URL(window.location.href);

          // If navigating to the exact same path (e.g. query param changes like ?step=fill), allow it without warning
          if (targetUrl.pathname === currentUrl.pathname) {
            return;
          }

          // If navigating away, show confirm dialog
          if (!window.confirm(warningText)) {
            event.preventDefault();
            event.stopPropagation();
          }
        } catch (err) {
          console.error("Error parsing link URL in useWarnIfUnsavedChanges:", err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // Use capture phase to ensure this runs before Next.js routing logic
    document.addEventListener('click', handleLinkClick, { capture: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, [isDirty, warningText]);
}
