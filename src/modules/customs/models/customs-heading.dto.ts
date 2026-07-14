import { IsBoolean, IsMongoId, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

export class CustomsHeadingDTO {
  @IsString()
  heading!: string;

  @IsString()
  chapter!: string;

  @IsString()
  description!: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateCustomsHeadingDTO extends PartialType(CustomsHeadingDTO) {
  @IsMongoId()
  _id!: string;
}
