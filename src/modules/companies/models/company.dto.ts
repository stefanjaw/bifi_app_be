import { IsString, IsNotEmpty, IsMongoId, IsOptional } from "class-validator";
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

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsMongoId()
  @IsOptional()
  defaultCurrencyId?: string;

  @IsOptional()
  active?: boolean;
}

export class UpdateCompanyDTO extends PartialType(CompanyDTO) {
  @IsMongoId()
  _id!: string;
}
