import { NextFunction, Request, Response } from "express";
import { BugReportingService } from "../services/bug-reporting-service";
import { FileValidatorService } from "../../../system";

export class BugReportingController {
  private readonly bugReportingService = new BugReportingService();
  private acceptedAttarchmentTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  /**
   * Handles HTTP POST requests to create a new bug report.
   * The request body contains the bug report data, and the request files are the attachments.
   * @param req - The express Request object containing the bug report data and attachments.
   * @param res - The express Response object used to send data back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */
  async createHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const fileValidator = new FileValidatorService();

      // Extract the request body and files
      const body = { ...req.body };
      const files = req.files as Express.Multer.File[];

      // Validate the attachments to be pdf or images
      if (files && files.length > 0) {
        for (const file of files) {
          fileValidator.validateFileType(file, this.acceptedAttarchmentTypes);
        }
      }

      // Create a new bug report
      const bugReport = await this.bugReportingService.reportBug({
        ...body,
        files: files, // Add the attachments to the bug report
      });

      // Send the bug report back to the client
      res.status(200).json(bugReport);
    } catch (error: any) {
      // Pass any errors to the next middleware
      next(error);
    }
  }

  create = async (req: Request, res: Response, next: NextFunction) => {
    await this.createHandler(req, res, next);
  };
}
