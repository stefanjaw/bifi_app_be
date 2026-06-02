import { NextFunction, Request, Response } from "express";
import { BaseController, ValidationException } from "../../../system";
import { SubscriberDocument } from "../models/subscriber.model";
import { SubscriberService } from "../services/subscriber-service";

const subscriberService = new SubscriberService();

export class SubscriberController extends BaseController<SubscriberDocument> {
  constructor() {
    super({ service: subscriberService });
  }

  importFromContacts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { listId, contactIds } = req.body as {
        listId?: string;
        contactIds?: string[];
      };
      if (!listId) throw new ValidationException("listId is required.");
      const result = await (
        this.service as SubscriberService
      ).importFromContacts(listId, contactIds);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
