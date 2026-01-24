/**
 * Web Application Entry Point
 *
 * Uses the FinCatchApp component from @repo/ui/embed for consistency.
 * This allows fin-catch to run standalone or be embedded in other apps.
 */
import { FinCatchApp } from "@repo/ui/embed";
import "@repo/ui/styles";

function App() {
  return <FinCatchApp />;
}

export default App;
