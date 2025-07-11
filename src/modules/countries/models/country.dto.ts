import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class CountryDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateCountryDTO extends PartialType(CountryDTO) {
  @IsMongoId()
  _id!: string;
}
