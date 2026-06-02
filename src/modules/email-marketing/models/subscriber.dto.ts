import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class SubscriberDTO {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsMongoId()
  listId!: string;

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsIn(["subscribed", "unsubscribed", "bounced", "complained"])
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @IsOptional()
  tags?: string[];

  @IsOptional()
  customFields?: any;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateSubscriberDTO extends PartialType(SubscriberDTO) {
  @IsMongoId()
  _id!: string;
}
