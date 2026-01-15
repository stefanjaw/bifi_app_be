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
import {
  AdditionalInformationTypeEnum,
  BCDTypeEnum,
  ChargeCodeTypeEnum,
  TaxIdTypeEnum,
  TaxTypeEnum,
  TransportMethodTypeEnum,
  ValuationMethodTypeEnum,
} from "./bcd.types";
import { PartialType } from "../../../system";

//Supplier and importer
class BCDSupplierDTO {
  @IsMongoId()
  contactId!: string;
}
class BCDImporterDTO {
  @IsMongoId()
  contactId!: string;
}

//Transport
class BCDTransportDTO {
  @IsEnum(TransportMethodTypeEnum)
  type!: TransportMethodTypeEnum;

  @IsString()
  @Length(1, 255)
  aircraftOrVessel!: string;

  @IsString()
  @Length(1, 255)
  flightOrVoyage!: string;

  @IsString()
  @Length(1, 255)
  port!: string;

  @IsDate()
  @Type(() => Date)
  arrivalDate!: string;
}

//Charge
class BCDChargeDTO {
  @IsEnum(ChargeCodeTypeEnum)
  @IsOptional()
  code?: ChargeCodeTypeEnum;

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
class BCDDeclarantDTO {
  @IsString()
  @Length(1, 255)
  name!: string;

  // !!! not mongoid but likely a code
  @IsString()
  @Length(5, 255)
  companyId!: string;

  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsString()
  capacity!: string;

  @IsString()
  traderReference!: string;
}

//Tax
class TaxEntryDTO {
  @IsEnum(TaxTypeEnum)
  type!: TaxTypeEnum;

  @IsEnum(TaxIdTypeEnum)
  taxId!: TaxIdTypeEnum;

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
  @IsEnum(AdditionalInformationTypeEnum)
  @Length(3)
  type!: AdditionalInformationTypeEnum;

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

  @IsString()
  @Length(4)
  cpc!: string;

  @IsMongoId()
  origin!: string;

  @IsString()
  @Contains(".")
  @Length(8)
  tariff!: string;

  @IsString()
  @MaxLength(200)
  description!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  quantityTwo?: number;

  @IsString()
  @MaxLength(10)
  supplementaryCode!: string;

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

  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => BCDChargeDTO)
  charges!: BCDChargeDTO[];

  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Type(() => TaxEntryDTO)
  tax!: TaxEntryDTO[];

  @ValidateNested({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Type(() => AdditionalInformationDTO)
  additionalInformation?: AdditionalInformationDTO[];
}

//Ogd
class BCDOgdDTO {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  paymentCode?: string;

  @IsString()
  costCode!: string;

  @IsString()
  objectCode!: string;

  @IsString()
  subsidiaryCode!: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}

//BCD
export class BcdDTO {
  @IsMongoId()
  shippingId!: string;

  @IsEnum(BCDTypeEnum)
  type!: BCDTypeEnum;

  @ValidateNested()
  @IsObject()
  @Type(() => BCDSupplierDTO)
  @Transform(({ value }) => plainToInstance(BCDSupplierDTO, JSON.parse(value)))
  supplier!: BCDSupplierDTO;

  @ValidateNested()
  @IsObject()
  @Type(() => BCDImporterDTO)
  @Transform(({ value }) => plainToInstance(BCDImporterDTO, JSON.parse(value)))
  importer!: BCDImporterDTO;

  @ValidateNested()
  @IsObject()
  @Type(() => BCDTransportDTO)
  @Transform(({ value }) => plainToInstance(BCDTransportDTO, JSON.parse(value)))
  transport!: BCDTransportDTO;

  @IsString()
  @MaxLength(255)
  manifest!: string;

  @IsString()
  @Length(1, 255)
  masterBOLAWB!: string;

  @IsMongoId()
  directShipmentCountry!: string;

  @IsMongoId()
  originalShipmentCountry!: string;

  @IsOptional()
  @IsString()
  @Length(4)
  warehouseId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BCDChargeDTO)
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    JSON.parse(value).map((charge: any) =>
      plainToInstance(BCDChargeDTO, charge)
    )
  )
  charges!: BCDChargeDTO[];

  @IsString({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsArray()
  @ArrayMinSize(1)
  containerIds!: string[];

  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) => JSON.parse(value))
  houseBOLAWB?: string[];

  @IsEnum(ValuationMethodTypeEnum)
  @Length(1, 255)
  valuationMethod!: ValuationMethodTypeEnum;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  packagesCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalInformationDTO)
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    JSON.parse(value).map((charge: any) =>
      plainToInstance(AdditionalInformationDTO, charge)
    )
  )
  additionalInformation!: AdditionalInformationDTO[];

  @ValidateNested()
  @IsObject()
  @Type(() => BCDOgdDTO)
  @Transform(({ value }) => plainToInstance(BCDOgdDTO, JSON.parse(value)))
  ogd!: BCDOgdDTO;

  @IsString({
    each: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  paymentAccounts?: string[];

  @ValidateNested()
  @IsObject()
  @Type(() => BCDDeclarantDTO)
  @Transform(({ value }) => plainToInstance(BCDDeclarantDTO, JSON.parse(value)))
  declarant!: BCDDeclarantDTO;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BCDRecordDTO)
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    JSON.parse(value).map((record: any) =>
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
