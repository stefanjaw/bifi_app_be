import { IsEnum, IsMongoId, IsOptional, ValidateIf } from "class-validator";
import { Transform } from "class-transformer";
import { ValuationMethod } from "./inventory-settings.model";

/** DTO for inventory settings (default warehouse/location + valuation method) */
export class InventorySettingsDTO {
  @IsMongoId()
  @ValidateIf((_, v) => !!v)
  @Transform(({ value }) =>
    value && value !== "null" && value !== "" ? value : null,
  )
  defaultWarehouseId?: string | null;

  @IsMongoId()
  @ValidateIf((_, v) => !!v)
  @Transform(({ value }) =>
    value && value !== "null" && value !== "" ? value : null,
  )
  defaultLocationId?: string | null;

  /** Inventory costing method used for valuation (FIFO reserved for future use) */
  @IsOptional()
  @IsEnum(ValuationMethod)
  valuationMethod?: ValuationMethod;
}
