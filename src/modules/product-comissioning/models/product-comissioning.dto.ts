import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";
import { FileUpload } from "../../../system/libraries/file-storage/file-upload.types";

export class ProductComissioningDTO {
  @IsIn(["fail", "pass"])
  outcome!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  details?: string;

  @IsOptional()
  attachments?: FileUpload;

  @IsMongoId()
  productId!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProductComissioningDTO extends PartialType(
  ProductComissioningDTO
) {
  @IsMongoId()
  _id!: string;
}
