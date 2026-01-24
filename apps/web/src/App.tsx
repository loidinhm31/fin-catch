/**
 * Web Application Entry Point
 *
 * Uses the FinCatchApp component from @fin-catch/ui/embed for consistency.
 * This allows fin-catch to run standalone or be embedded in other apps.
 */
import { FinCatchApp } from "@fin-catch/ui/embed";
import "@fin-catch/ui/styles";

function App() {
  return <FinCatchApp />;
}

export default App;
