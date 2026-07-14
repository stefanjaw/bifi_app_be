import { IsBoolean, IsMongoId, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

export class CustomsChapterDTO {
  @IsString()
  number!: string;

  @IsString()
  description!: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateCustomsChapterDTO extends PartialType(CustomsChapterDTO) {
  @IsMongoId()
  _id!: string;
}
