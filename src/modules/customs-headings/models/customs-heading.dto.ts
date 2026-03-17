import { IsBoolean, IsMongoId, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";

export class CustomsHeadingDTO {
  @IsString()
  heading!: string;

  @IsString()
  chapter!: string;

  @IsString()
  description!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateCustomsHeadingDTO extends PartialType(CustomsHeadingDTO) {
  @IsMongoId()
  _id!: string;
}
