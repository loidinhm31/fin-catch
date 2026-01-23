import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fin-catch/ui/styles";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
