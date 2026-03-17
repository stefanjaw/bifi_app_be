import { IsBoolean, IsMongoId, IsOptional, IsString } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";

export class CustomsChapterDTO {
  @IsString()
  number!: string;

  @IsString()
  description!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateCustomsChapterDTO extends PartialType(CustomsChapterDTO) {
  @IsMongoId()
  _id!: string;
}
