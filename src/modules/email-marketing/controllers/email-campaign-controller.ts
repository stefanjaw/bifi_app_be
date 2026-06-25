import { NextFunction, Request, Response } from "express";
import { BaseController, ValidationException } from "../../../system";
import { EmailCampaignDocument } from "../models/email-campaign.model";
import { EmailCampaignService } from "../services/email-campaign-service";
import { CampaignSendService } from "../services/campaign-send-service";

const emailCampaignService = new EmailCampaignService();
const campaignSendService = new CampaignSendService();

export class EmailCampaignController extends BaseController<EmailCampaignDocument> {
  constructor() {
    super({ service: emailCampaignService });
  }

  dashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await (this.service as EmailCampaignService).dashboard();
      this.sendData(res, data);
    } catch (error) {
      next(error);
    }
  };

  sendTest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const email = (req.body?.email as string) || "";
      if (!email) throw new ValidationException("email is required.");
      const result = await campaignSendService.sendTest(id, email);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  sendNow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const summary = await campaignSendService.sendNow(id);
      this.sendData(res, summary);
    } catch (error) {
      next(error);
    }
  };

  schedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const scheduledAt = req.body?.scheduledAt;
      if (!scheduledAt)
        throw new ValidationException("scheduledAt is required.");
      const date = new Date(scheduledAt);
      if (isNaN(date.getTime()))
        throw new ValidationException("scheduledAt is invalid.");
      const result = await (this.service as EmailCampaignService).setSchedule(
        id,
        date
      );
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const result = await (this.service as EmailCampaignService).cancel(id);
      this.sendData(res, result);
    } catch (error) {
      next(error);
    }
  };
}
