import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsPhoneNumber,
} from "class-validator";
import { PartialType } from "../../../system";

export class CompanyDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  countryId!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateCompanyDTO extends PartialType(CompanyDTO) {
  @IsMongoId()
  _id!: string;
}
