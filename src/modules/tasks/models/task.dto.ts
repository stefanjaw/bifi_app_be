import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { FileUpload, PartialType } from "../../../system";
import { Transform, Type } from "class-transformer";

export class TaskDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  plannedStartDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  plannedEndDate?: Date;

  // in seconds
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  plannedDuration?: number;

  // porcentages from 0 to 100
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  progress?: number;

  @IsOptional()
  @IsMongoId()
  stage?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) => typeof value === "string" ? JSON.parse(value) : value)
  dependencyIds?: string[];

  @IsOptional()
  @IsMongoId()
  parentId?: string;

  @IsOptional()
  @IsEnum(["low", "medium", "high", "urgent"])
  priority?: "low" | "medium" | "high" | "urgent";

  @IsOptional()
  @IsMongoId()
  assigned?: string;

  @IsOptional()
  attachments?: FileUpload;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateTaskDTO extends PartialType(TaskDTO) {
  @IsMongoId()
  _id!: string;
}
