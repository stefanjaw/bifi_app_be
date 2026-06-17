import { IsString, IsOptional, IsBoolean } from "class-validator";

export class NotificationDTO {
  @IsString()
  userId!: string;

  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  module?: string;
}

export class UpdateNotificationDTO {
  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
