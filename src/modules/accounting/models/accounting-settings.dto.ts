import {
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type, Transform } from "class-transformer";

/** Inventory-side accounts used for GL posting of stock movements (Phase B) */
export class InventoryAccountsDTO {
  @IsMongoId()
  @IsOptional()
  inventoryAccountId?: string;

  @IsMongoId()
  @IsOptional()
  cogsAccountId?: string;

  @IsMongoId()
  @IsOptional()
  adjustmentLossAccountId?: string;

  @IsMongoId()
  @IsOptional()
  apPendingAccountId?: string;

  @IsMongoId()
  @IsOptional()
  defaultCurrencyId?: string;
}

export class AccountingSettingsDTO {
  @IsMongoId()
  @IsOptional()
  invoiceSequence?: string;

  @IsMongoId()
  @IsOptional()
  purchasePayableAccountId?: string;

  @IsMongoId()
  @IsOptional()
  discountGrantedAccountId?: string;

  @IsMongoId()
  @IsOptional()
  depreciationJournalId?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => InventoryAccountsDTO)
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  inventoryAccounts?: InventoryAccountsDTO;

  @IsString()
  @IsOptional()
  description?: string;
}
