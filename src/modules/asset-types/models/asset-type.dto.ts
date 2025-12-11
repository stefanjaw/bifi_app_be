import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";

export class AssetTypeDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsOptional()
  active?: boolean;
}

export class UpdateAssetTypeDTO extends PartialType(AssetTypeDTO) {
  @IsMongoId()
  _id!: string;
}
