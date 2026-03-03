import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsMongoId, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";

export class UomCategoryDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateUomCategoryDTO extends PartialType(UomCategoryDTO) {
  @IsMongoId()
  _id!: string;
}
