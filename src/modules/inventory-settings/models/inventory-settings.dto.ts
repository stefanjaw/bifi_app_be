import { IsMongoId, ValidateIf } from "class-validator";
import { Transform } from "class-transformer";

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
}
