import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class ProjectStageDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
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

export class UpdateProjectStageDTO extends PartialType(ProjectStageDTO) {
  @IsMongoId()
  _id!: string;
}
