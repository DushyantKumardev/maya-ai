/**
 * ============================================================================
 * Shared Global Types
 * ============================================================================
 */

/**
 * Represents a standard error shape across the application.
 * Use this instead of 'any' in catch blocks or error states.
 */
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

/**
 * Type guard and helper to extract a clean message from any unknown error.
 */
export function ensureError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      details: error,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return error as AppError;
  }

  return {
    message: "An unexpected error occurred",
    details: error,
  };
}

export function getErrorMessage(error: unknown): string {
  return ensureError(error).message;
}
