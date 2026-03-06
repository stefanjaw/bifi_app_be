import { IsArray, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";
import { JournalEntryStatus } from "./journal-entry.model";

export class JournalEntryLineDTO {
  @IsMongoId()
  accountId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  debit!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  credit!: number;

  @IsString()
  @IsOptional()
  lineType?: string;

  @IsMongoId()
  @IsOptional()
  productId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  unitPrice?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  taxIds?: string[];

  @IsMongoId()
  @IsOptional()
  discountId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  amount?: number;
}

export class JournalEntryDTO {
  @IsMongoId()
  journalId!: string;

  @IsDateString()
  date!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsMongoId()
  currencyId!: string;

  @IsEnum(JournalEntryStatus)
  @IsOptional()
  status?: JournalEntryStatus;

  @IsMongoId()
  @IsOptional()
  companyId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDTO)
  @IsNotEmpty()
  lines!: JournalEntryLineDTO[];
}

export class UpdateJournalEntryDTO extends PartialType(JournalEntryDTO) {
  @IsMongoId()
  _id!: string;
}
