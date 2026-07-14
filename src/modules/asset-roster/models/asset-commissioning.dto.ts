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

export class AssetCommissioningDTO {
  @IsIn(["fail", "pass"])
  outcome!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  details?: string;

  @IsOptional()
  attachments?: FileUpload;

  @IsMongoId()
  assetRosterId!: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateAssetCommissioningDTO extends PartialType(
  AssetCommissioningDTO,
) {
  @IsMongoId()
  _id!: string;
}
