import Mailgun from "mailgun.js";
import formData from "form-data";
import {
  EmailSender,
  SendEmailParams,
  SendResult,
  VerifyResult,
  formatFrom,
} from "./email-sender.interface";

export class MailgunSender implements EmailSender {
  readonly provider = "mailgun";
  private client: any;
  private domain: string;

  constructor(apiKey: string, domain: string, region: string = "us") {
    const mailgun = new Mailgun(formData as any);
    this.client = mailgun.client({
      username: "api",
      key: apiKey,
      url:
        region === "eu"
          ? "https://api.eu.mailgun.net"
          : "https://api.mailgun.net",
    });
    this.domain = domain;
  }

  async send(params: SendEmailParams): Promise<SendResult> {
    try {
      const message: Record<string, any> = {
        from: formatFrom(params.fromName, params.fromEmail),
        to: params.to,
        subject: params.subject,
        html: params.html,
      };
      if (params.text) message.text = params.text;
      if (params.replyTo) message["h:Reply-To"] = params.replyTo;
      if (params.headers) {
        for (const [k, v] of Object.entries(params.headers)) {
          message[`h:${k}`] = v;
        }
      }
      const res = await this.client.messages.create(this.domain, message);
      return { success: true, messageId: res?.id };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  async verify(): Promise<VerifyResult> {
    try {
      await this.client.domains.get(this.domain);
      return { ok: true, message: "Mailgun credentials are valid." };
    } catch (err: any) {
      return { ok: false, message: err?.message || String(err) };
    }
  }
}
