import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

// Extend Express Request to carry userId and dbUser
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      dbUserId?: number;
      dbUserRole?: string;
    }
  }
}

/**
 * Middleware: requires a valid Clerk session.
 * Attaches req.userId (Clerk ID) to the request.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

/**
 * Middleware: requires auth + provisions/fetches DB user record (JIT).
 * Attaches req.dbUserId and req.dbUserRole.
 */
export const requireDbUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = clerkId;

  try {
    let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    if (!user) {
      // JIT provision: create the user record
      const email = (auth.sessionClaims?.email as string) ?? "";
      const name = (auth.sessionClaims?.name as string) ?? null;
      [user] = await db.insert(usersTable).values({ clerkId, email, name }).returning();
    }
    req.dbUserId = user.id;
    req.dbUserRole = user.role;
    next();
  } catch (err) {
    logger.error({ err }, "Error provisioning DB user");
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Middleware: requires admin role.
 * Must be used after requireDbUser.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.dbUserRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};
