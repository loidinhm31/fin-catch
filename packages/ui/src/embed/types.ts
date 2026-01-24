/**
 * Types for embedding fin-catch in other applications
 */

/**
 * Auth tokens passed from parent application
 */
export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}

/**
 * Props for the embeddable FinCatchApp component
 */
export interface FinCatchEmbedProps {
  /**
   * Auth tokens from parent application.
   * When provided, fin-catch will use these tokens instead of showing login.
   */
  authTokens?: AuthTokens;

  /**
   * Whether fin-catch is running in embedded mode.
   * When true, hides outer navigation elements (sidebar, header).
   */
  embedded?: boolean;

  /**
   * Callback when user requests logout.
   * Parent application should handle clearing tokens and showing login.
   */
  onLogoutRequest?: () => void;

  /**
   * Optional class name for the root container
   */
  className?: string;
}
