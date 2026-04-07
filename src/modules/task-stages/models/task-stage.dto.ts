import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class TaskStageDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateTaskStageDTO extends PartialType(TaskStageDTO) {
  @IsMongoId()
  _id!: string;
}
