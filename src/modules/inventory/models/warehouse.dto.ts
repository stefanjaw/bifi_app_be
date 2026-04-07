import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class WarehouseDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateWarehouseDTO extends PartialType(WarehouseDTO) {
  @IsMongoId()
  _id!: string;
}
