import {
  IsArray,
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

export class PaymentTermLineDTO {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  percentage!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  dueDays!: number;
}

export class PaymentTermDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentTermLineDTO)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(PaymentTermLineDTO, item)
    )
  )
  @IsOptional()
  lines?: PaymentTermLineDTO[];
}

export class UpdatePaymentTermDTO extends PartialType(PaymentTermDTO) {
  @IsMongoId()
  _id!: string;
}
