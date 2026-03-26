import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class TaskTypeDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateTaskTypeDTO extends PartialType(TaskTypeDTO) {
  @IsMongoId()
  _id!: string;
}
