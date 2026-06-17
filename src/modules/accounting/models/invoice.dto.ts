import {
  IsArray,
  IsDate,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { plainToInstance, Transform, Type } from "class-transformer";
import { PartialType } from "../../../system";

export class CrInformacionReferenciaDTO {
  @IsString()
  tipoDocIR!: string;

  @IsString()
  @IsOptional()
  tipoDocRefOTRO?: string;

  @IsString()
  numero!: string;

  @IsDate()
  @Type(() => Date)
  fechaEmisionIR!: Date;

  @IsString()
  codigo!: string;

  @IsString()
  @IsOptional()
  codigoReferenciaOTRO?: string;

  @IsString()
  @MaxLength(180)
  razon!: string;
}

export class AccountingInvoiceLineDTO {
  @IsString()
  @IsIn(['product', 'tax', 'counterpart'])
  @IsOptional()
  lineType?: string;

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

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  debit?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  credit?: number;
}

export class AccountingInvoiceDTO {
  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsMongoId()
  @IsOptional()
  paymentTermId?: string;

  @IsDate()
  @Type(() => Date)
  invoiceDate!: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

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
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(AccountingInvoiceLineDTO, item)
    )
  )
  @IsOptional()
  lines?: AccountingInvoiceLineDTO[];

  @IsString()
  @IsIn(["FE", "ND", "NC", "TE", "FEC", "FEE", "REP"])
  @IsOptional()
  crEinvoiceType?: string;

  @IsMongoId()
  @IsOptional()
  crCondicionVentaId?: string;

  @IsMongoId()
  @IsOptional()
  crMedioPagoId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  crPlazoCredito?: number;

  @IsString()
  @IsOptional()
  crCodigoActividadEmisor?: string;

  @IsString()
  @IsOptional()
  crCodigoActividadReceptor?: string;

  @IsMongoId()
  @IsOptional()
  crReferenciaInvoiceId?: string;

  @ValidateNested()
  @Type(() => CrInformacionReferenciaDTO)
  @IsOptional()
  crInformacionReferencia?: CrInformacionReferenciaDTO;
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

  @IsDate()
  @Type(() => Date)
  paymentDate!: Date;

  @IsMongoId()
  journalId!: string;

  @IsMongoId()
  currencyId!: string;

  @IsString()
  @IsOptional()
  reference?: string;
}
