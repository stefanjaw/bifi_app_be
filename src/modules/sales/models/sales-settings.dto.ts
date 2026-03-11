import { IsMongoId, IsOptional, IsString } from "class-validator";

export class SalesSettingsDTO {
  @IsMongoId()
  @IsOptional()
  orderSequence?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
