import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new product lot */
export class ProductLotDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsNotEmpty() code!: string;
  @IsString() @IsOptional() barCode?: string;
  @IsString() @IsOptional() internationalCode?: string;
  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  products?: string[];
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}

/** DTO for updating an existing product lot */
export class UpdateProductLotDTO extends PartialType(ProductLotDTO) {
  @IsMongoId() _id!: string;
}
