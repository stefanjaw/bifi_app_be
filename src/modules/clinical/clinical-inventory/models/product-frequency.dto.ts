import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new product frequency */
export class ProductFrequencyDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}

/** DTO for updating an existing product frequency */
export class UpdateProductFrequencyDTO extends PartialType(
  ProductFrequencyDTO,
) {
  @IsMongoId() _id!: string;
}
