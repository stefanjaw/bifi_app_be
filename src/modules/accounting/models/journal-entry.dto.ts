import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { plainToInstance, Transform, Type } from "class-transformer";
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

  @IsDate()
  @Type(() => Date)
  date!: Date;

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
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(JournalEntryLineDTO, item)
    )
  )
  @IsNotEmpty()
  lines!: JournalEntryLineDTO[];
}

export class UpdateJournalEntryDTO extends PartialType(JournalEntryDTO) {
  @IsMongoId()
  _id!: string;
}
