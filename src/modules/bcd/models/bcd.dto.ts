import { Type } from "class-transformer";
import {
  ArrayMinSize,
  Contains,
  IsDate,
  IsDateString,
  IsEnum,
  IsISO31661Alpha3,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  AdditionalInformationType,
  BCDType,
  ValuationMethod,
} from "./bcd-data.model";
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
  @IsEnum({
    airline: "AIRLINE",
    vessel: "VESSEL",
  })
  type!: "AIRLINE" | "VESSEL";

  @IsString()
  @Length(1, 255)
  aircraftOrVessel!: string;

  @IsString()
  @Length(1, 255)
  voyageOrFlightNo!: string;

  @IsString()
  @Length(1, 255)
  port!: string;

  @IsDateString()
  arrivalDate!: string;
}

//Charge
class BCDChargeDTO {
  @IsMongoId()
  id!: string;

  @IsNumber()
  @Min(0)
  @ValidateIf((object, value) => value !== null)
  percentage!: number | null;

  @IsNumber()
  @Min(0)
  amount!: number;
}

//Declarant
class BCDDeclarantDTO {
  @IsString()
  @Length(1, 255)
  name!: string;

  @IsString()
  @Length(1, 255)
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
  @IsString()
  type!: string;

  @IsString()
  id!: string;

  @IsNumber()
  @Min(0)
  valueForTax!: number;

  @IsNumber()
  @Min(0)
  ratePercentage!: number;

  @IsNumber()
  @Min(0)
  amount!: number;
}

//Additional info
export class AdditionalInformationDTO {
  @IsEnum(AdditionalInformationType)
  @Length(3)
  type!: AdditionalInformationType;

  @IsString()
  @MaxLength(70)
  value!: string;
}

//Records
export class BCDRecordDTO {
  @IsNumber()
  @Min(0)
  number!: number;

  @IsString()
  @Length(4)
  cpc!: string;

  @IsString()
  @IsISO31661Alpha3()
  origin!: string;

  @IsString()
  @Type(() => String)
  @Contains(".")
  @Length(8)
  tariff!: string;

  @IsString()
  @MaxLength(200)
  description!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @ValidateIf((object, value) => value !== null)
  quantityTwo!: number | null;

  @IsString()
  @MaxLength(10)
  supplementaryCode!: string;

  @IsString()
  @Length(3)
  currency!: string;

  @IsNumber()
  @Min(0)
  linesSubtotal!: number;

  @IsNumber()
  @Min(0)
  exchangeRate!: number;

  @ValidateNested({ each: true })
  @Type(() => BCDChargeDTO)
  charges!: BCDChargeDTO[];

  @ValidateNested({ each: true })
  @Type(() => TaxEntryDTO)
  tax!: TaxEntryDTO[];

  @ValidateNested({ each: true })
  @Type(() => AdditionalInformationDTO)
  additionalInformation!: AdditionalInformationDTO[];
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
  @IsEnum(BCDType)
  type!: BCDType;

  @ValidateNested()
  @Type(() => BCDSupplierDTO)
  supplier!: BCDSupplierDTO;

  @ValidateNested()
  @Type(() => BCDImporterDTO)
  importer!: BCDImporterDTO;

  @ValidateNested()
  @Type(() => BCDTransportDTO)
  transport!: BCDTransportDTO;

  @IsString()
  @MaxLength(255)
  manifest!: string;

  @IsString()
  @Length(1, 255)
  masterBOLAWB!: string;

  @IsString()
  @IsISO31661Alpha3()
  directShipmentCountry!: string;

  @IsString()
  @IsISO31661Alpha3()
  originalShipmentCountry!: string;

  @IsOptional()
  @IsString()
  @Length(4, 4)
  warehouseId?: string;

  @ValidateNested({ each: true })
  @Type(() => BCDChargeDTO)
  charges!: BCDChargeDTO[];

  @IsString({
    each: true,
  })
  containerIds!: string[];

  @IsOptional()
  @IsString({
    each: true,
  })
  houseBOLAWB?: string[];

  @IsEnum(ValuationMethod)
  @Length(1, 255)
  valuationMethod!: ValuationMethod;

  @IsNumber()
  @Min(0)
  packagesCount!: number;

  @ValidateNested({ each: true })
  @Type(() => AdditionalInformationDTO)
  additionalInformation!: AdditionalInformationDTO[];

  @ValidateNested()
  @Type(() => BCDOgdDTO)
  ogd!: BCDOgdDTO;

  @IsString({
    each: true,
  })
  paymentAccounts!: string[];

  @ValidateNested()
  @Type(() => BCDDeclarantDTO)
  declarant!: BCDDeclarantDTO;

  @ValidateNested({ each: true })
  @Type(() => BCDRecordDTO)
  @ArrayMinSize(1, {
    message: "At least one record is required",
  })
  records!: BCDRecordDTO[];
}

//Update DTO
export class UpdateBcdDTO extends PartialType(BcdDTO) {
  @IsMongoId()
  _id!: string;
}
