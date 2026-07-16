import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType } from "../../../system";

export class RecurrentTaskDTO {
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  deltaTime?: number;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  repetitionTimes?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  repetitionLapse?: number;

  @IsEnum([
    "annually",
    "monthly",
    "weekly",
    "daily",
    "firstInMonth",
    "secondInMonth",
    "thirdInMonth",
    "fourthInMonth",
  ])
  @IsOptional()
  repetitionSequence?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  repetitionDays?: string[];

  @IsMongoId()
  @IsOptional()
  parentId?: string;
}

export class UpdateRecurrentTaskDTO extends PartialType(RecurrentTaskDTO) {
  @IsMongoId()
  _id!: string;
}
