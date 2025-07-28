import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsBoolean,
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

  @IsOptional()
  active?: boolean;
}

export class UpdateCompanyDTO extends PartialType(CompanyDTO) {
  @IsMongoId()
  _id!: string;
}
