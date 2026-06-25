import { Type } from "class-transformer";
import { IsMongoId, IsNumber, Min } from "class-validator";
import { PartialType } from "../../../system";

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

export class UpdateStockBalanceDTO extends PartialType(StockBalanceDTO) {
  @IsMongoId()
  _id!: string;
}
