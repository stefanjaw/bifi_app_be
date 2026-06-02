import { EmailSender } from "./email-sender.interface";
import { ResendSender } from "./resend-sender";
import { MailgunSender } from "./mailgun-sender";
import { SesSender } from "./ses-sender";
import { SendgridSender } from "./sendgrid-sender";
import { EmailSettingsDocument } from "../models/email-settings.model";

export class EmailSenderError extends Error {}

export function createSender(settings: EmailSettingsDocument): EmailSender {
  const provider = settings.provider || "resend";

  switch (provider) {
    case "resend": {
      if (!settings.resendApiKey)
        throw new EmailSenderError("Resend API key is not configured.");
      return new ResendSender(settings.resendApiKey);
    }
    case "mailgun": {
      if (!settings.mailgunApiKey || !settings.mailgunDomain)
        throw new EmailSenderError(
          "Mailgun API key and domain are required."
        );
      return new MailgunSender(
        settings.mailgunApiKey,
        settings.mailgunDomain,
        settings.mailgunRegion || "us"
      );
    }
    case "ses": {
      if (!settings.sesAccessKeyId || !settings.sesSecretAccessKey)
        throw new EmailSenderError(
          "Amazon SES access key and secret are required."
        );
      return new SesSender(
        settings.sesAccessKeyId,
        settings.sesSecretAccessKey,
        settings.sesRegion || "us-east-1"
      );
    }
    case "sendgrid": {
      if (!settings.sendgridApiKey)
        throw new EmailSenderError("SendGrid API key is not configured.");
      return new SendgridSender(settings.sendgridApiKey);
    }
    default:
      throw new EmailSenderError(`Unknown email provider: ${provider}`);
  }
}
