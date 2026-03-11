import { IsMongoId, IsOptional, IsString } from "class-validator";

export class AccountingSettingsDTO {
  @IsMongoId()
  @IsOptional()
  invoiceSequence?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
