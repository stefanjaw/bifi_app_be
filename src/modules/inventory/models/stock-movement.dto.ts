import { Type } from "class-transformer";
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType } from "../../../system";
import { MovementType } from "./stock-movement.model";

export class StockMovementDTO {
  @IsMongoId()
  productId!: string;

  @IsMongoId()
  warehouseId!: string;

  @IsMongoId()
  locationId!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type!: MovementType;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  date?: Date;
}

export class UpdateStockMovementDTO extends PartialType(StockMovementDTO) {
  @IsMongoId()
  _id!: string;
}

export class TransferDTO {
  @IsMongoId()
  productId!: string;

  @IsMongoId()
  fromWarehouseId!: string;

  @IsMongoId()
  fromLocationId!: string;

  @IsMongoId()
  toWarehouseId!: string;

  @IsMongoId()
  toLocationId!: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
