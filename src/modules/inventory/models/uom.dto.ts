import { Type } from "class-transformer";
import { IsBoolean, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";

export class UomDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsMongoId()
  categoryId!: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateUomDTO extends PartialType(UomDTO) {
  @IsMongoId()
  _id!: string;
}
