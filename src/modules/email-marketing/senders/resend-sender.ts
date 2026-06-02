import { Resend } from "resend";
import {
  EmailSender,
  SendEmailParams,
  SendResult,
  VerifyResult,
  formatFrom,
} from "./email-sender.interface";

export class ResendSender implements EmailSender {
  readonly provider = "resend";
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(params: SendEmailParams): Promise<SendResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: formatFrom(params.fromName, params.fromEmail),
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        replyTo: params.replyTo || undefined,
        headers: params.headers,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  async verify(): Promise<VerifyResult> {
    try {
      await this.client.domains.list();
      return { ok: true, message: "Resend API key is valid." };
    } catch (err: any) {
      return { ok: false, message: err?.message || String(err) };
    }
  }
}
