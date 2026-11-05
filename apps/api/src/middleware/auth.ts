import type { RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

export type PlatformRole = "READER" | "CREATOR" | "MODERATOR" | "ADMIN";
export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export const requireAuthenticatedUser: RequestHandler = async (request, response, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Sign in to access this resource.",
        },
      });
      return;
    }

    response.locals.authSession = session;
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRoles(...allowedRoles: PlatformRole[]): RequestHandler {
  return (_request, response, next) => {
    const session = response.locals.authSession as AuthSession | undefined;

    if (!session) {
      response.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Sign in to access this resource.",
        },
      });
      return;
    }

    const role = session.user.role as PlatformRole;

    if (!allowedRoles.includes(role)) {
      response.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Your account does not have permission to access this resource.",
        },
      });
      return;
    }

    next();
  };
}
