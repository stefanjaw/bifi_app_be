import { plainToInstance, Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BCDTaxTypeImpactDTO {
  @IsBoolean()
  @Transform(toBoolean)
  wharfageRate!: boolean;
}

export class BCDTaxTypeDTO {
  @IsString()
  @Length(1)
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BCDTaxTypeImpactDTO)
  @Transform(({ value }) =>
    plainToInstance(
      BCDTaxTypeImpactDTO,
      typeof value === "string" ? JSON.parse(value) : value
    )
  )
  impact?: BCDTaxTypeImpactDTO;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateBCDTaxTypeDTO extends PartialType(BCDTaxTypeDTO) {
  @IsMongoId()
  _id!: string;
}
