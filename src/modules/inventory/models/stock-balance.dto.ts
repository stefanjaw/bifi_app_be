import { Type } from "class-transformer";
import { IsMongoId, IsNumber, Min } from "class-validator";
import { PartialType } from "../../../system";

/** DTO for creating a new stock balance record */
export class StockBalanceDTO {
  @IsMongoId()
  productId!: string;

  @IsMongoId()
  locationId!: string;

  @IsMongoId()
  warehouseId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;
}

/** DTO for updating an existing stock balance record */
export class UpdateStockBalanceDTO extends PartialType(StockBalanceDTO) {
  @IsMongoId()
  _id!: string;
}
