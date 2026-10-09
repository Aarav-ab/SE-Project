import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ComplaintProvider } from "./ComplaintContext";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ComplaintProvider>
      <App />
    </ComplaintProvider>
  </StrictMode>,
);
