import type { NextAuthConfig } from "next-auth";

/**
 * ROUTES CONFIGURATION
 * --------------------
 * To add a new protected route:
 * 1. If it's a public page (landing, terms, etc.), add it to `publicRoutes`.
 * 2. If it's a login/register page, add it to `authRoutes`.
 * 3. Any other route NOT in these lists will be PROTECTED by default.
 */

// Routes that don't require authentication
const publicRoutes = ["/"];

// Routes used for authentication (will redirect to DEFAULT_LOGIN_REDIRECT if already logged in)
const authRoutes = ["/login", "/register", "/forgot-password"];

// The prefix for API authentication routes (Auth.js internal routes)
const apiAuthPrefix = "/api/auth";

// Where to go after login
const DEFAULT_LOGIN_REDIRECT = "/c";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * JWT Callback
     * Runs whenever a JSON Web Token is created (at sign in) or updated.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * Session Callback
     * Controls what data is exposed in the session object (accessible via useSession/auth()).
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },

    /**
     * Authorized Callback
     * This is the heart of route protection in NextAuth v5.
     * It runs before every request handled by the middleware.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Allow internal Auth.js API routes (always public)
      const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
      if (isApiAuthRoute) return true;

      // Handle Authentication Routes (/login, /register)
      const isAuthRoute = authRoutes.includes(pathname);
      if (isAuthRoute) {
        if (isLoggedIn) {
          // Redirect logged-in users away from login/register pages
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
      }

      // Handle Public Routes
      const isPublicRoute = publicRoutes.includes(pathname);
      if (isPublicRoute) return true;

      // Static Assets Check (Backup for middleware matcher)
      const isStaticAsset = pathname.match(
        /\.(png|jpg|jpeg|svg|gif|ico|css|js)$/,
      );
      if (isStaticAsset) return true;

      /**
       * PROTECTED ROUTES (Default behavior)
       * Any route that didn't match the above is considered protected.
       * If isLoggedIn is true, access is granted.
       * If isLoggedIn is false, NextAuth will automatically redirect to the signIn page.
       */
      return isLoggedIn;
    },
  },
  providers: [], // Providers are added in auth.ts
} satisfies NextAuthConfig;
