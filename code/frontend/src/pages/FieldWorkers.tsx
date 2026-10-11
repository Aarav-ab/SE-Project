import { useEffect, useRef } from "react";

type FieldWorkersProps = {
  onSignOut: () => void;
  onOpenDepartment: () => void;
  onOpenAnalytics: () => void;
};

function FieldWorkers({
  onSignOut,
  onOpenDepartment,
  onOpenAnalytics,
}: FieldWorkersProps) {
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

      const handleAnalytics = (event: MouseEvent) => {
        event.preventDefault();
        onOpenAnalytics();
      };

      links[0]?.addEventListener("click", handleDepartment);
      links[2]?.addEventListener("click", handleAnalytics);

      return () => {
        signOut?.removeEventListener("click", handleSignOut);
        links[0]?.removeEventListener("click", handleDepartment);
        links[2]?.removeEventListener("click", handleAnalytics);
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
  }, [onSignOut, onOpenDepartment, onOpenAnalytics]);

  return (
    <iframe
      ref={frameRef}
      title="NagrikConnect Field Workers"
      src="/field-workers.html"
      style={{
        display: "block",
        width: "100%",
        height: "100vh",
        border: 0,
      }}
    />
  );
}

export default FieldWorkers;