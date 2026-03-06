import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";
import { AccountType } from "./account.model";

export class AccountDTO {
  @IsMongoId()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  type!: AccountType;

  @IsMongoId()
  @IsOptional()
  parentAccountId?: string;

  @IsMongoId()
  @IsOptional()
  currencyId?: string;

  @IsOptional()
  active?: boolean;
}

export class UpdateAccountDTO extends PartialType(AccountDTO) {
  @IsMongoId()
  _id!: string;
}
