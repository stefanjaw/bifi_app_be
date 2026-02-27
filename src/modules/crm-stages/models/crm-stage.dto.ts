import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { PartialType } from "../../../system";

export class CrmStageDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  order?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  probability?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isWon?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isLost?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateCrmStageDTO extends PartialType(CrmStageDTO) {
  @IsMongoId()
  _id!: string;
}
