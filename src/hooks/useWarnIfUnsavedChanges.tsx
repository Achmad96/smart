import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useWarnIfUnsavedChanges(
  isDirty: boolean,
  warningText = "Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin keluar?"
) {
  const router = useRouter();

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

          // If navigating away, show custom toast
          event.preventDefault();
          event.stopPropagation();
          
          toast((t) => (
            <div className="flex flex-col gap-3 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Peringatan</h4>
                  <p className="text-sm text-slate-600 mt-1">{warningText}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    router.push(target.href);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Keluar
                </button>
              </div>
            </div>
          ), { duration: Infinity, id: 'unsaved-warning' });

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
      toast.dismiss('unsaved-warning');
    };
  }, [isDirty, warningText, router]);
}
