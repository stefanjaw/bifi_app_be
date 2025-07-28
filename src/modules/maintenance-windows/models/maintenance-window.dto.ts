import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class MaintenanceWindowDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  daysBefore!: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  daysAfter!: number;

  @IsIn(["daily", "weekly", "monthly", "quarterly", "semi-anually", "annually"])
  recurrency!: string;

  @IsOptional()
  active?: boolean;
}

export class UpdateMaintenanceWindowDTO extends PartialType(
  MaintenanceWindowDTO
) {
  @IsMongoId()
  _id!: string;
}
