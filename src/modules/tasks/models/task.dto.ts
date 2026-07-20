import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { FileUpload, PartialType, toBoolean } from "../../../system";
import { Transform, Type } from "class-transformer";

export class TaskAssigneeDTO {
  @IsMongoId()
  @IsNotEmpty()
  staffId!: string;
}

export class TaskDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
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

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  plannedDuration?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  progress?: number;

  @IsOptional()
  @IsMongoId()
  typeId?: string;

  @IsOptional()
  @IsMongoId()
  stage?: string;

  @IsOptional()
  @IsMongoId()
  projectId?: string;

  @IsOptional()
  @IsMongoId()
  ticketId?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
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
  @Transform(toBoolean)
  active?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  isMilestone?: boolean;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  sequence?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clTags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clAssignees?: TaskAssigneeDTO[];

  @IsOptional()
  @IsMongoId()
  clRecordId?: string;

  @IsOptional()
  @IsMongoId()
  clContactId?: string;

  @IsOptional()
  @IsMongoId()
  clRecurrentTaskId?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  clDone?: boolean;
}

export class UpdateTaskDTO extends PartialType(TaskDTO) {
  @IsMongoId()
  _id!: string;
}
