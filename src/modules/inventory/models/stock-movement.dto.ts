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
import { AdjustmentDirection, MovementType } from "./stock-movement.model";

/** DTO for creating a new stock movement */
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

  /** Unit cost override for the movement; defaults to the product's cost price when omitted (IN/ADJUSTMENT) or to the current weighted average (OUT) */
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  unitCost?: number;

  @IsEnum(MovementType)
  @IsNotEmpty()
  type!: MovementType;

  /** Direction for ADJUSTMENT movements; the type/direction combination rule is enforced in the service */
  @IsOptional()
  @IsEnum(AdjustmentDirection)
  adjustmentDirection?: AdjustmentDirection;

  @IsString()
  @IsOptional()
  reference?: string;

  /** Classification of the external reference (e.g. purchase-order, sales-order); reserved for future integrations */
  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  date?: Date;
}

/** DTO for updating an existing stock movement */
export class UpdateStockMovementDTO extends PartialType(StockMovementDTO) {
  @IsMongoId()
  _id!: string;
}

/** DTO for transferring stock between locations */
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

/** DTO for reversing a posted stock movement */
export class ReversalDTO {
  /** Optional note attached to the reversal movement */
  @IsString()
  @IsOptional()
  notes?: string;
}
