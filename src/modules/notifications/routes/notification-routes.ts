import { Router } from "express";
import { authorizeMiddleware } from "../../../system";
import { NotificationController } from "../controllers/notification-controller";

const notificationController = new NotificationController();

export class NotificationRouter {
  private router = Router();

  get getRouter() {
    return this.router;
  }

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    // /unread-count and /mark-all-read must come before /:id routes
    this.router.get(
      "/notifications/unread-count",
      authorizeMiddleware("notifications", "read"),
      notificationController.getUnreadCount
    );

    this.router.patch(
      "/notifications/mark-all-read",
      authorizeMiddleware("notifications", "update"),
      notificationController.markAllRead
    );

    this.router.patch(
      "/notifications/mark-all-seen",
      authorizeMiddleware("notifications", "update"),
      notificationController.markAllSeen
    );

    this.router.get(
      "/notifications",
      authorizeMiddleware("notifications", "read"),
      notificationController.getMyNotifications
    );

    this.router.patch(
      "/notifications/:id/read",
      authorizeMiddleware("notifications", "update"),
      notificationController.markRead
    );
  }
}
