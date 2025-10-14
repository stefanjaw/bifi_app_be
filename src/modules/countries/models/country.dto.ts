import {
  IsISO4217CurrencyCode,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType } from "../../../system";

export class CountryDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsISO4217CurrencyCode()
  currencyCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1)
  currencySymbol!: string;

  @IsOptional()
  active?: boolean;
}

export class UpdateCountryDTO extends PartialType(CountryDTO) {
  @IsMongoId()
  _id!: string;
}
