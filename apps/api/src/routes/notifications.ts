import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/database.js";
import { requireAuthenticatedUser, type AuthSession } from "../middleware/auth.js";

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function currentUserId(response: Response) {
  return (response.locals.authSession as AuthSession).user.id;
}

router.use(requireAuthenticatedUser);

router.get("/", async (request, response, next) => {
  try {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({
        error: { code: "INVALID_PAGINATION", message: "Page must be positive and limit must be between 1 and 50." },
      });
      return;
    }

    const recipientId = currentUserId(response);
    const { page, limit } = parsed.data;
    const where = { recipientId };
    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        include: {
          story: {
            select: {
              slug: true,
              title: true,
              coverImageUrl: true,
              author: { select: { displayName: true, creatorHandle: true } },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { recipientId, readAt: null } }),
    ]);

    response.status(200).json({
      notifications,
      unreadCount,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/read-all", async (_request, response, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { recipientId: currentUserId(response), readAt: null },
      data: { readAt: new Date() },
    });
    response.status(200).json({ updated: result.count });
  } catch (error) {
    next(error);
  }
});

router.patch("/:notificationId/read", async (request, response, next) => {
  try {
    const parsedId = z.string().trim().min(1).max(64).safeParse(request.params.notificationId);
    if (!parsedId.success) {
      response.status(400).json({
        error: { code: "INVALID_NOTIFICATION", message: "A valid notification ID is required." },
      });
      return;
    }

    const recipientId = currentUserId(response);
    const updated = await prisma.notification.updateMany({
      where: { id: parsedId.data, recipientId, readAt: null },
      data: { readAt: new Date() },
    });

    if (updated.count === 0) {
      const owned = await prisma.notification.findFirst({
        where: { id: parsedId.data, recipientId },
        select: { id: true },
      });
      if (!owned) {
        response.status(404).json({
          error: { code: "NOTIFICATION_NOT_FOUND", message: "This notification could not be found." },
        });
        return;
      }
    }

    response.status(200).json({ read: true });
  } catch (error) {
    next(error);
  }
});

export default router;
