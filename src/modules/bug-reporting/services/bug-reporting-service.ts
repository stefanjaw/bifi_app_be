import { BugDTO } from "../models/bug.dto";
import { bugStatus } from "../models/bug.model";
import FormData from "form-data";
import axios from "axios";

export class BugReportingService {
  private readonly TYPE_ID = "7";
  private readonly PROJECT_ID = process.env.BUG_REPORTING_PROJECT_ID || "";
  private readonly URL = process.env.BUG_REPORTING_URL || "";
  // private readonly password = process.env.BUG_REPORTING_PASSWORD || "";

  /**
   * Report a bug to the bug tracker.
   *
   * @param {BugDTO} data - The bug report data.
   * @return {Promise<Response>} - The response from the API.
   */
  async reportBug(data: BugDTO): Promise<bugStatus> {
    try {
      // creating form data
      const formData = new FormData();

      // Fields
      formData.append("subject", data.subject);
      formData.append("description", data.description);
      formData.append("startDate", new Date().toISOString());
      formData.append("platform", data.platform);
      formData.append("email", data.email);
      formData.append("typeId", this.TYPE_ID);
      formData.append("projectId", this.PROJECT_ID);

      // files
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        // loop through each file
        for (const file of data.files) {
          const multerFile = file as Express.Multer.File;

          // append file
          formData.append("files", multerFile.buffer, {
            contentType: multerFile.mimetype,
            filename: multerFile.originalname,
          });
        }
      }

      // post request
      const bug = await axios.post(this.URL, formData, {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      return {
        id: bug.data.id,
        subject: bug.data.subject,
        status: bug.data.status,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
