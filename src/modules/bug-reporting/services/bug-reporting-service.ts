import { BugDTO } from "../models/bug.dto";
import { bug } from "../models/bug.model";

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
  async reportBug(data: BugDTO): Promise<bug> {
    try {
      // creating form data
      const formData = new FormData();

      // password
      // formData.append("password", this.password);

      // subject
      formData.append("subject", data.subject);

      // description
      formData.append("description", data.description);

      // start date
      formData.append("startDate", new Date().toISOString());

      // type
      formData.append("typeId", this.TYPE_ID);

      // project
      formData.append("projectId", this.PROJECT_ID);

      // files
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        // loop through each file
        for (const file of data.files) {
          const multerFile = file as Express.Multer.File;

          // create blob
          const blob = new Blob([new Uint8Array(multerFile.buffer)], {
            type: multerFile.mimetype,
          });

          // append to form
          formData.append("files", blob, multerFile.originalname);
        }
      }

      // send request
      const bug = await fetch(this.URL, {
        method: "POST",
        body: formData,
      });

      // throw error if response is not ok
      if (!bug.ok) {
        const message = await bug.json();
        throw new Error(message.error);
      }

      // return response
      const json = await bug.json();

      return {
        id: json.id,
        subject: json.subject,
        // description: json.description,
        // startDate: json.startDate,
        // typeId: json.typeId,
        // projectId: json.projectId,
        status: json.status,
      };
    } catch (error) {
      // throw error
      throw error;
    }
  }
}
