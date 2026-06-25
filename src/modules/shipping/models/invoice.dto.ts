import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { FileUpload, toBoolean } from "../../../system";
import { CommentStatus, InvoiceStatus } from "./invoice.model";

class ExtractedTariffDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  code?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  chapter?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  heading?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  subheading?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userDescription?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  rateOfDuty?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  unitOfMeasurement?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  tax?: number;
}

export class ExtractedLineDTO {
  @IsString()
  @IsNotEmpty()
  lineNumber!: string;

  @IsMongoId()
  countryId!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Type(() => Number)
  price!: number;

  @IsNumber()
  @Type(() => Number)
  subtotal!: number;

  @IsString()
  @IsNotEmpty()
  customsClassification!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  @IsOptional()
  hsCode?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  customsChapter?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  customsHeading?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  customsSubheading?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  chapterDescription?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  headingDescription?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  subheadingDescription?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  recordNumber?: number;

  @ValidateNested()
  @IsObject()
  @Type(() => ExtractedTariffDTO)
  @IsOptional()
  tariff?: ExtractedTariffDTO;
}

class ExtractedHeaderDTO {
  @IsString()
  invoiceNumber!: string;

  @IsDate()
  @Type(() => Date)
  date!: Date;

  @IsMongoId()
  countryId!: string;

  @IsMongoId()
  companyId!: string;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsNumber()
  @Type(() => Number)
  total!: number;

  @IsOptional()
  @IsString()
  currency?: string | null;
}

class InvoiceExtractedDataDTO {
  @ValidateNested()
  @IsObject()
  @Type(() => ExtractedHeaderDTO)
  header!: ExtractedHeaderDTO;

  @ValidateNested({ each: true })
  @Type(() => ExtractedLineDTO)
  @ArrayMinSize(1)
  @IsArray()
  lines!: ExtractedLineDTO[];
}

class InvoicePDFDTO {
  @ValidateNested()
  @IsObject()
  @Type(() => InvoiceExtractedDataDTO)
  extractedData!: InvoiceExtractedDataDTO;

  @IsOptional()
  file?: FileUpload;
}

class InvoiceCommentDTO {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAt?: Date;

  @IsMongoId()
  @IsOptional()
  createdBy?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;

  @IsEnum(CommentStatus)
  @IsOptional()
  status?: CommentStatus;
}

export class InvoiceDTO {
  @ValidateNested()
  @IsObject()
  @Type(() => InvoicePDFDTO)
  @Transform(({ value }) =>
    plainToInstance(
      InvoicePDFDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  pdf!: InvoicePDFDTO;

  @ValidateNested({ each: true })
  @Type(() => InvoiceCommentDTO)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(InvoiceCommentDTO, item)
    )
  )
  @IsArray()
  @IsOptional()
  comments?: InvoiceCommentDTO[];

  @IsEnum(InvoiceStatus)
  status!: InvoiceStatus;
}
