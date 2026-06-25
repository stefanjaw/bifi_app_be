import { IsIn, IsMongoId, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";

export class EmailEventDTO {
  @IsMongoId()
  @IsOptional()
  campaignId?: string;

  @IsMongoId()
  @IsOptional()
  subscriberId?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsIn([
    "sent",
    "delivered",
    "open",
    "click",
    "bounce",
    "complaint",
    "unsubscribe",
    "failed",
  ])
  type!: string;

  @IsString()
  @IsOptional()
  providerMessageId?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsOptional()
  meta?: any;
}

export class UpdateEmailEventDTO extends PartialType(EmailEventDTO) {
  @IsMongoId()
  _id!: string;
}
