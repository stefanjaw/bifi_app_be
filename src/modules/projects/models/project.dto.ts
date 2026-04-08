import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class ProjectDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  stage?: string;

  @IsEnum(["low", "medium", "high", "urgent"])
  @IsOptional()
  priority?: "low" | "medium" | "high" | "urgent";

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsDate()
  @Type(() => Date)
  dateStart!: Date;

  @IsDate()
  @Type(() => Date)
  dateEnd!: Date;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  sequence?: number;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateProjectDTO extends PartialType(ProjectDTO) {
  @IsMongoId()
  _id!: string;
}
