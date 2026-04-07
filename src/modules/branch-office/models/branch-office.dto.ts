import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BranchOfficeDTO {
  @IsMongoId()
  companyId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  branchCode!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsMongoId()
  @IsOptional()
  countryId?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateBranchOfficeDTO extends PartialType(BranchOfficeDTO) {
  @IsMongoId()
  _id!: string;
}
