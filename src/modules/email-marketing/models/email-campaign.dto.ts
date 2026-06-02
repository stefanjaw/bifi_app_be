import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class EmailCampaignDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @IsOptional()
  designJson?: any;

  @IsString()
  @IsOptional()
  mjml?: string;

  @IsString()
  @IsOptional()
  html?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  @IsOptional()
  listIds?: string[];

  @IsString()
  @IsIn(["draft", "scheduled", "sending", "sent", "failed", "cancelled"])
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateEmailCampaignDTO extends PartialType(EmailCampaignDTO) {
  @IsMongoId()
  _id!: string;
}
