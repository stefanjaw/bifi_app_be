import sgMail from "@sendgrid/mail";
import sgClient from "@sendgrid/client";
import {
  EmailSender,
  SendEmailParams,
  SendResult,
  VerifyResult,
} from "./email-sender.interface";

export class SendgridSender implements EmailSender {
  readonly provider = "sendgrid";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    sgMail.setApiKey(apiKey);
  }

  async send(params: SendEmailParams): Promise<SendResult> {
    try {
      sgMail.setApiKey(this.apiKey);
      const [response] = await sgMail.send({
        to: params.to,
        from: params.fromName
          ? { email: params.fromEmail, name: params.fromName }
          : params.fromEmail,
        replyTo: params.replyTo || undefined,
        subject: params.subject,
        html: params.html,
        text: params.text || " ",
        headers: params.headers,
      });
      const messageId = response?.headers?.["x-message-id"] as
        | string
        | undefined;
      return { success: true, messageId };
    } catch (err: any) {
      const msg =
        err?.response?.body?.errors?.[0]?.message ||
        err?.message ||
        String(err);
      return { success: false, error: msg };
    }
  }

  async verify(): Promise<VerifyResult> {
    try {
      sgClient.setApiKey(this.apiKey);
      await sgClient.request({ method: "GET", url: "/v3/scopes" });
      return { ok: true, message: "SendGrid API key is valid." };
    } catch (err: any) {
      const msg =
        err?.response?.body?.errors?.[0]?.message ||
        err?.message ||
        String(err);
      return { ok: false, message: msg };
    }
  }
}
