import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { FileUpload, PartialType, toBoolean } from "../../../system";
import { Transform, Type } from "class-transformer";

export class TicketDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  priority?: "low" | "medium" | "high" | "urgent";

  @IsOptional()
  @IsEnum(["task", "helpdesk"])
  type?: "task" | "helpdesk";

  @IsOptional()
  @IsMongoId()
  stage?: string;

  @IsOptional()
  @IsMongoId()
  assigned?: string;

  @IsOptional()
  @IsMongoId()
  senderUser?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  followers?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  tags?: string[];

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  appModule?: string;

  @IsOptional()
  attachments?: FileUpload;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  slaResponseDeadline?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  slaResolutionDeadline?: Date;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  taskIds?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateStart?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateEnd?: Date;

  @IsString()
  @IsOptional()
  duration?: string;
}

export class UpdateTicketDTO extends PartialType(TicketDTO) {
  @IsMongoId()
  _id!: string;
}
