import { Type } from "class-transformer";
import {
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class ActivityHistoryDTO {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  details?: string;

  @IsDate()
  @Type(() => Date)
  performDate!: Date;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsMongoId()
  modelId!: string;

  @IsOptional()
  metadata?: object;
}

export class UpdateActivityHistoryDTO extends PartialType(ActivityHistoryDTO) {
  @IsMongoId()
  _id!: string;
}
