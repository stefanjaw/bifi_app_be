export interface SendEmailParams {
  to: string;
  fromName?: string;
  fromEmail: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerifyResult {
  ok: boolean;
  message: string;
}

export interface EmailSender {
  readonly provider: string;
  send(params: SendEmailParams): Promise<SendResult>;
  verify(): Promise<VerifyResult>;
}

/** Formats a sender name+email into the standard "Name <email>" format, or just the email if no name is given. @param fromName - Optional display name. @param fromEmail - The sender email address. @returns The formatted from string. */
export function formatFrom(fromName: string | undefined, fromEmail: string) {
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}
