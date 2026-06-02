import {
  SESv2Client,
  SendEmailCommand,
  GetAccountCommand,
} from "@aws-sdk/client-sesv2";
import {
  EmailSender,
  SendEmailParams,
  SendResult,
  VerifyResult,
  formatFrom,
} from "./email-sender.interface";

export class SesSender implements EmailSender {
  readonly provider = "ses";
  private client: SESv2Client;

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.client = new SESv2Client({
      region: region || "us-east-1",
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async send(params: SendEmailParams): Promise<SendResult> {
    try {
      const command = new SendEmailCommand({
        FromEmailAddress: formatFrom(params.fromName, params.fromEmail),
        Destination: { ToAddresses: [params.to] },
        ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
        Content: {
          Simple: {
            Subject: { Data: params.subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: params.html, Charset: "UTF-8" },
              Text: params.text
                ? { Data: params.text, Charset: "UTF-8" }
                : undefined,
            },
            Headers: params.headers
              ? Object.entries(params.headers).map(([Name, Value]) => ({
                  Name,
                  Value,
                }))
              : undefined,
          },
        },
      });
      const res = await this.client.send(command);
      return { success: true, messageId: res.MessageId };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  }

  async verify(): Promise<VerifyResult> {
    try {
      await this.client.send(new GetAccountCommand({}));
      return { ok: true, message: "Amazon SES credentials are valid." };
    } catch (err: any) {
      return { ok: false, message: err?.message || String(err) };
    }
  }
}
