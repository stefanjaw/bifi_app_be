import { Transform } from "class-transformer";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { toBoolean } from "../../../system";

export class EmailSettingsDTO {
  @IsString()
  @IsIn(["resend", "mailgun", "ses", "sendgrid"])
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsString()
  @IsOptional()
  resendApiKey?: string;

  @IsString()
  @IsOptional()
  mailgunApiKey?: string;

  @IsString()
  @IsOptional()
  mailgunDomain?: string;

  @IsString()
  @IsIn(["us", "eu"])
  @IsOptional()
  mailgunRegion?: string;

  @IsString()
  @IsOptional()
  sesAccessKeyId?: string;

  @IsString()
  @IsOptional()
  sesSecretAccessKey?: string;

  @IsString()
  @IsOptional()
  sesRegion?: string;

  @IsString()
  @IsOptional()
  sendgridApiKey?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  trackOpens?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  trackClicks?: boolean;

  @IsString()
  @IsOptional()
  footerText?: string;

  @IsString()
  @IsOptional()
  unsubscribeText?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  testMode?: boolean;

  @IsString()
  @IsOptional()
  testRecipient?: string;

  @IsString()
  @IsOptional()
  publicBaseUrl?: string;
}
