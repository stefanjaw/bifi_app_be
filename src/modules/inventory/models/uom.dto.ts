import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class UomDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsMongoId()
  categoryId!: string;

  @IsString()
  @IsOptional()
  crUnidadMedida?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateUomDTO extends PartialType(UomDTO) {
  @IsMongoId()
  _id!: string;
}
