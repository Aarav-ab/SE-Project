import { useEffect, useRef } from "react";

type DepartmentPortalProps = {
  onSignOut: () => void;
  onOpenFieldWorkers: () => void;
  onOpenAnalytics: () => void;
};

/**
 * Keeps the existing department-portal.html presentation intact.
 *
 * Place the original department-portal.html file in the frontend's public/
 * directory. This wrapper intentionally does not recreate or override its CSS.
 */
function DepartmentPortal({
  onSignOut,
  onOpenFieldWorkers,
  onOpenAnalytics,
}: DepartmentPortalProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const attachHandlers = () => {
      const doc = frame.contentDocument;
      if (!doc) return;

      const signOut = doc.querySelector<HTMLAnchorElement>(
        '.admin-topbar .btn-signout',
      );
      signOut?.addEventListener("click", (event) => {
        event.preventDefault();
        onSignOut();
      });

      const navLinks = doc.querySelectorAll<HTMLAnchorElement>(".admin-nav a");
      navLinks[1]?.addEventListener("click", (event) => {
        event.preventDefault();
        onOpenFieldWorkers();
      });
      navLinks[2]?.addEventListener("click", (event) => {
        event.preventDefault();
        onOpenAnalytics();
      });
    };

    frame.addEventListener("load", attachHandlers);
    if (frame.contentDocument?.readyState === "complete") attachHandlers();

    return () => frame.removeEventListener("load", attachHandlers);
  }, [onSignOut, onOpenFieldWorkers, onOpenAnalytics]);

  return (
    <iframe
      ref={frameRef}
      title="NagrikConnect Department Complaints"
      src="/department-portal.html"
      style={{
        display: "block",
        width: "100%",
        height: "100vh",
        border: 0,
      }}
    />
  );
}

export default DepartmentPortal;
