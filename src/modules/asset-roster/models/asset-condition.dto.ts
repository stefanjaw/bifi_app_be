import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";

export class AssetConditionDTO {
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

export class UpdateAssetConditionDTO extends PartialType(AssetConditionDTO) {
  @IsMongoId()
  _id!: string;
}
