import { IsMongoId, IsOptional, IsString } from "class-validator";

export class AccountingSettingsDTO {
  @IsMongoId()
  @IsOptional()
  invoiceSequence?: string;

  @IsMongoId()
  @IsOptional()
  purchasePayableAccountId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
