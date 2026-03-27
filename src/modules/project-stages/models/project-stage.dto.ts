import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class ProjectStageDTO {
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
  isDefault?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateProjectStageDTO extends PartialType(ProjectStageDTO) {
  @IsMongoId()
  _id!: string;
}
