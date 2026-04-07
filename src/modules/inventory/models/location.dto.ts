import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class LocationDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsMongoId()
  warehouseId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateLocationDTO extends PartialType(LocationDTO) {
  @IsMongoId()
  _id!: string;
}
