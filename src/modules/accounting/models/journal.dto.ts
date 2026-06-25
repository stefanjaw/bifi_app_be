import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";
import { JournalType } from "./journal.model";

export class JournalDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsEnum(JournalType)
  @IsNotEmpty()
  journalType!: JournalType;

  @IsMongoId()
  @IsOptional()
  defaultDebitAccountId?: string;

  @IsMongoId()
  @IsOptional()
  defaultCreditAccountId?: string;

  @IsMongoId()
  @IsOptional()
  currencyId?: string;

  @IsOptional()
  active?: boolean;
}

export class UpdateJournalDTO extends PartialType(JournalDTO) {
  @IsMongoId()
  _id!: string;
}
