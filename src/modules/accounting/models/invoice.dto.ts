import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";

export class AccountingInvoiceLineDTO {
  @IsMongoId()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  accountId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsMongoId()
  @IsOptional()
  unitOfMeasureId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  taxIds?: string[];

  @IsMongoId()
  @IsOptional()
  discountId?: string;
}

export class AccountingInvoiceDTO {
  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsMongoId()
  @IsOptional()
  paymentTermId?: string;

  @IsDateString()
  invoiceDate!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsMongoId()
  journalId!: string;

  @IsMongoId()
  @IsOptional()
  salespersonId?: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsMongoId()
  @IsOptional()
  fiscalPositionId?: string;

  @IsMongoId()
  @IsOptional()
  companyId?: string;

  @IsMongoId()
  currencyId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountingInvoiceLineDTO)
  @IsOptional()
  lines?: AccountingInvoiceLineDTO[];
}

export class UpdateAccountingInvoiceDTO extends PartialType(AccountingInvoiceDTO) {
  @IsMongoId()
  _id!: string;
}

export class RegisterPaymentDTO {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @IsDateString()
  paymentDate!: string;

  @IsMongoId()
  journalId!: string;

  @IsMongoId()
  currencyId!: string;

  @IsString()
  @IsOptional()
  reference?: string;
}
