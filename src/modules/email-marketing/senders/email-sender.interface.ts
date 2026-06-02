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

export function formatFrom(fromName: string | undefined, fromEmail: string) {
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}
