import { NextFunction, Request, Response } from "express";
import { userStorage } from "../../../system";
import { NotificationService } from "../services/notification-service";

const notificationService = new NotificationService();

export class NotificationController {
  getMyNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = userStorage.getStore()?.user;
      if (!user) {
        res.json([]);
        return;
      }
      const limit = parseInt(req.query["limit"] as string) || 20;
      const data = await notificationService.getMyNotifications(
        user._id,
        limit
      );
      res.json(data);
    } catch (e) {
      next(e);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = userStorage.getStore()?.user;
      if (!user) {
        res.json({ total: 0, byModule: {} });
        return;
      }
      const data = await notificationService.getUnreadCount(user._id);
      res.json(data);
    } catch (e) {
      next(e);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = userStorage.getStore()?.user;
      if (!user) {
        res.json({ ok: true });
        return;
      }
      await notificationService.markAllRead(user._id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  };

  markAllSeen = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = userStorage.getStore()?.user;
      if (!user) {
        res.json({ ok: true });
        return;
      }
      await notificationService.markAllSeen(user._id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await notificationService.markRead(id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  };
}
