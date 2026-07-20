import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new product route */
export class ProductRouteDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}

/** DTO for updating an existing product route */
export class UpdateProductRouteDTO extends PartialType(ProductRouteDTO) {
  @IsMongoId() _id!: string;
}
