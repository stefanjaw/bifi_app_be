import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

/** DTO for creating a new care continuum level record */
export class CareContinuumLevelDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() value!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing care continuum level record */
export class UpdateCareContinuumLevelDTO extends PartialType(
  CareContinuumLevelDTO,
) {
  @IsMongoId() _id!: string;
}
