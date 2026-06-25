import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";
import { PaymentType } from "./payment.model";

export class PaymentDTO {
  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType!: PaymentType;

  @IsMongoId()
  @IsOptional()
  partnerId?: string;

  @IsMongoId()
  journalId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @IsMongoId()
  currencyId!: string;

  @IsDate()
  @Type(() => Date)
  paymentDate!: Date;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsMongoId()
  @IsOptional()
  journalEntryId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  exchangeRate?: number;
}

export class UpdatePaymentDTO extends PartialType(PaymentDTO) {
  @IsMongoId()
  _id!: string;
}
