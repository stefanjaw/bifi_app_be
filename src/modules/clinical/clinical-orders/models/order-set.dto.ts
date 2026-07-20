import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../../system";
import { Transform } from "class-transformer";

/** DTO for creating a new clinical order set */
export class OrderSetDTO {
  @IsMongoId()
  @IsNotEmpty()
  careContinuumId!: string;

  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  byName!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  orders?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing clinical order set */
export class UpdateOrderSetDTO extends PartialType(OrderSetDTO) {
  @IsMongoId()
  _id!: string;
}
