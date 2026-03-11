import { IsMongoId, IsOptional, IsString } from "class-validator";

export class PurchaseSettingsDTO {
  @IsMongoId()
  @IsOptional()
  purchaseSequence?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
