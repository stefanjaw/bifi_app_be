import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class NotificationEventConfigDTO {
  @IsString()
  type!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recipients?: string[];
}

export class UpdateNotificationSettingsDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationEventConfigDTO)
  events!: NotificationEventConfigDTO[];
}
