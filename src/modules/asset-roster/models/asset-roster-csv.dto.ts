import { AssetRosterDocument } from "@mongodb-types";
import { CSVStringSeparator } from "../../../system";
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { toBoolean } from "../../../system";

export class AssetRosterCSVDTO {
  @IsMongoId()
  @IsOptional()
  id?: string;

  /**
   * Required when creating a new record. Optional when updating — if the column
   * is absent the existing value is preserved. @IsOptional prevents class-validator
   * from firing "should not be empty" when the cell is blank or the column is
   * not selected in the import dialog.
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  productModel?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  serialNumber?: string;

  /**
   * Accepts any ISO-compatible date string (YYYY-MM-DD or full ISO-8601).
   * The @Transform converts the string to a Date before @IsDate validates it.
   * @IsOptional prevents errors when the column is absent or the cell is empty.
   */
  @IsDate({
    message: (args) =>
      `acquiredDate: "${args.value}" is not a valid date. Use ISO format YYYY-MM-DD.`,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed;
  })
  acquiredDate?: Date;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  })
  acquiredPrice?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  })
  currentPrice?: number;

  @IsString()
  @IsOptional()
  condition?: string;

  /**
   * Required when creating a new record. Optional when updating.
   * Same rationale as productModel above.
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  assetTypes?: CSVStringSeparator;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  vendors?: CSVStringSeparator;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  makes?: CSVStringSeparator;

  /**
   * Room code that identifies the location in the system.
   * The value must match an existing Room's code field exactly.
   * An error is raised at import time if the code is not found.
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  location?: string;

  /**
   * Semicolon-separated list of maintenance windows in the format
   * exported by the system: "name - recurrency".
   * Each entry must exactly match an existing Maintenance Window.
   * An error is raised at import time if any entry is not found.
   */
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  maintenanceWindows?: CSVStringSeparator;

  @IsDate({
    message: (args) =>
      `warrantyDate: "${args.value}" is not a valid date. Use ISO format YYYY-MM-DD.`,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed;
  })
  warrantyDate?: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remarks?: CSVStringSeparator;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}
