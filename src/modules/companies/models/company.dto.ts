import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsIn,
  IsBoolean,
  ValidateIf,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

export class CompanyDTO {
  @IsString()
  @IsIn(["company", "branch-office"])
  @IsOptional()
  type?: string;

  @IsMongoId()
  @ValidateIf((o) => o.type === "branch-office")
  parentCompany?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  @IsOptional()
  countryId?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsMongoId()
  @IsOptional()
  defaultCurrencyId?: string;

  @IsString()
  @IsOptional()
  branchCode?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isDefault?: boolean;

  @IsOptional()
  active?: boolean;
}

export class UpdateCompanyDTO extends PartialType(CompanyDTO) {
  @IsMongoId()
  _id!: string;
}
