import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  Contains,
  IsArray,
  IsDate,
  IsEnum,
  IsISO4217CurrencyCode,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { ValuationMethodTypeEnum } from "./bcd-enums";
import { PartialType } from "../../../system";

//Supplier and importer
export class BCDSupplierDTO {
  @IsMongoId()
  contactId!: string;
}

export class BCDImporterDTO {
  @IsMongoId()
  contactId!: string;
}

//Transport
export class BCDTransportDTO {
  @IsMongoId()
  aircraftOrVessel!: string;

  @IsString()
  @MaxLength(10)
  flightOrVoyage!: string;

  @IsMongoId()
  port!: string;

  @IsDate()
  @Type(() => Date)
  arrivalDate!: string;
}

//Charge
export class BCDChargeDTO {
  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  code?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  percentage?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;
}

//Declarant
export class BCDDeclarantDTO {
  @IsString()
  @MaxLength(30)
  name!: string;

  // !!! not mongoid but likely a code
  @IsString()
  @Length(6)
  companyId!: string;

  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsString()
  @MaxLength(20)
  capacity!: string;

  @IsString()
  @MaxLength(40)
  traderReference!: string;
}

//Tax
export class TaxEntryDTO {
  @IsMongoId()
  type!: string;

  @IsMongoId()
  taxId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  valueForTax!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ratePercentage!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;
}

//Additional info
export class AdditionalInformationDTO {
  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  type?: string;

  @IsString()
  @MaxLength(70)
  value!: string;
}

//Records
export class BCDRecordDTO {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  number!: number;

  @IsMongoId()
  cpc!: string;

  @IsMongoId()
  origin!: string;

  @IsString()
  @Length(7)
  tariff!: string;

  @IsString()
  @MaxLength(200)
  description!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  quantityTwo?: number;

  @IsString()
  @MaxLength(10)
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  supplementaryCode?: string;

  @IsString()
  @Length(3)
  @IsISO4217CurrencyCode()
  currency!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  linesSubtotal!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  exchangeRate!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bdaValue!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalDue!: number;

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => BCDChargeDTO)
  charges?: BCDChargeDTO[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => TaxEntryDTO)
  tax?: TaxEntryDTO[];

  @ValidateNested({ each: true })
  @IsArray()
  @IsOptional()
  @Type(() => AdditionalInformationDTO)
  additionalInformation?: AdditionalInformationDTO[];
}

//Ogd
class BCDOgdDTO {
  @IsString()
  @MaxLength(3)
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  paymentCode?: string;

  @IsString()
  @IsOptional()
  @Length(5)
  @Transform(({ value }) => (value === "" ? null : value))
  costCode?: string;

  @IsString()
  @IsOptional()
  @Length(4)
  @Transform(({ value }) => (value === "" ? null : value))
  objectCode?: string;

  @IsString()
  @IsOptional()
  @Length(5)
  @Transform(({ value }) => (value === "" ? null : value))
  subsidiaryCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  @Length(5)
  @Transform(({ value }) => (value === "" ? null : value))
  explanation?: string;
}

//BCD
export class BcdDTO {
  @IsMongoId()
  shippingId!: string;

  @IsMongoId()
  type!: string;

  @ValidateNested()
  @IsObject()
  @Type(() => BCDSupplierDTO)
  @Transform(({ value }) =>
    plainToInstance(
      BCDSupplierDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  supplier!: BCDSupplierDTO;

  @ValidateNested()
  @IsObject()
  @Type(() => BCDImporterDTO)
  @Transform(({ value }) =>
    plainToInstance(
      BCDImporterDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  importer!: BCDImporterDTO;

  @ValidateNested()
  @IsObject()
  @Type(() => BCDTransportDTO)
  @Transform(({ value }) =>
    plainToInstance(
      BCDTransportDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  transport!: BCDTransportDTO;

  @IsString()
  @MaxLength(20)
  manifest!: string;

  @IsString()
  @MaxLength(20)
  masterBOLAWB!: string;

  @IsMongoId()
  directShipmentCountry!: string;

  @IsMongoId()
  originalShipmentCountry!: string;

  @IsString()
  @Length(4)
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BCDChargeDTO)
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((charge: any) =>
      plainToInstance(BCDChargeDTO, charge)
    )
  )
  charges!: BCDChargeDTO[];

  @IsString({ each: true })
  @MaxLength(20, { each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  @IsArray()
  @ArrayMinSize(1)
  containerIds!: string[];

  @IsOptional()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  @IsArray()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  houseBOLAWBs?: string[];

  @IsEnum(ValuationMethodTypeEnum)
  @Length(2, 3)
  valuationMethod!: ValuationMethodTypeEnum;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  packagesCount!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  recordsCount!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  invoiceAmount!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  payableAmount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalInformationDTO)
  @IsOptional()
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((charge: any) =>
      plainToInstance(AdditionalInformationDTO, charge)
    )
  )
  additionalInformation?: AdditionalInformationDTO[];

  @ValidateNested()
  @IsObject()
  @Type(() => BCDOgdDTO)
  @Transform(({ value }) =>
    plainToInstance(
      BCDOgdDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  ogd!: BCDOgdDTO;

  @IsString({
    each: true,
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value
  )
  paymentAccounts?: string[];

  @ValidateNested()
  @IsObject()
  @Type(() => BCDDeclarantDTO)
  @Transform(({ value }) =>
    plainToInstance(
      BCDDeclarantDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  declarant!: BCDDeclarantDTO;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BCDRecordDTO)
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((record: any) =>
      plainToInstance(BCDRecordDTO, record)
    )
  )
  records!: BCDRecordDTO[];
}

//Update DTO
export class UpdateBcdDTO extends PartialType(BcdDTO) {
  @IsMongoId()
  _id!: string;
}
