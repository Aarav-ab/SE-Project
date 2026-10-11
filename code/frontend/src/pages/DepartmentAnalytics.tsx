import { useEffect, useRef } from "react";

type DepartmentAnalyticsProps = {
  onSignOut: () => void;
  onOpenDepartment: () => void;
  onOpenFieldWorkers: () => void;
};

function DepartmentAnalytics({
  onSignOut,
  onOpenDepartment,
  onOpenFieldWorkers,
}: DepartmentAnalyticsProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const attachHandlers = () => {
      const doc = frame.contentDocument;
      if (!doc) return;

      const signOut = doc.querySelector<HTMLAnchorElement>(
        ".admin-topbar .btn-signout"
      );

      const handleSignOut = (event: MouseEvent) => {
        event.preventDefault();
        onSignOut();
      };

      signOut?.addEventListener("click", handleSignOut);

      const links = doc.querySelectorAll<HTMLAnchorElement>(
        ".admin-nav a"
      );

      const handleDepartment = (event: MouseEvent) => {
        event.preventDefault();
        onOpenDepartment();
      };

      const handleFieldWorkers = (event: MouseEvent) => {
        event.preventDefault();
        onOpenFieldWorkers();
      };

      links[0]?.addEventListener("click", handleDepartment);
      links[1]?.addEventListener("click", handleFieldWorkers);

      return () => {
        signOut?.removeEventListener("click", handleSignOut);
        links[0]?.removeEventListener("click", handleDepartment);
        links[1]?.removeEventListener("click", handleFieldWorkers);
      };
    };

    let cleanup: (() => void) | undefined;

    const handleLoad = () => {
      cleanup?.();
      cleanup = attachHandlers();
    };

    frame.addEventListener("load", handleLoad);

    if (frame.contentDocument?.readyState === "complete") {
      handleLoad();
    }

    return () => {
      frame.removeEventListener("load", handleLoad);
      cleanup?.();
    };
  }, [onSignOut, onOpenDepartment, onOpenFieldWorkers]);

  return (
    <iframe
      ref={frameRef}
      title="NagrikConnect Department Analytics"
      src="/department-analytics.html"
      style={{
        display: "block",
        width: "100%",
        height: "100vh",
        border: 0,
      }}
    />
  );
}

export default DepartmentAnalytics;