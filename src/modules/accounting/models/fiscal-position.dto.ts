import { IsArray, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { plainToInstance, Transform, Type } from "class-transformer";
import { PartialType } from "../../../system";

export class TaxMappingDTO {
  @IsMongoId()
  fromTaxId!: string;

  @IsMongoId()
  toTaxId!: string;
}

export class AccountMappingDTO {
  @IsMongoId()
  fromAccountId!: string;

  @IsMongoId()
  toAccountId!: string;
}

export class FiscalPositionDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxMappingDTO)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(TaxMappingDTO, item)
    )
  )
  @IsOptional()
  taxMappings?: TaxMappingDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AccountMappingDTO)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(AccountMappingDTO, item)
    )
  )
  @IsOptional()
  accountMappings?: AccountMappingDTO[];
}

export class UpdateFiscalPositionDTO extends PartialType(FiscalPositionDTO) {
  @IsMongoId()
  _id!: string;
}
