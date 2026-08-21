import {
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";
import { Transform } from "class-transformer";

export class CreateApiKeyDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  /**
   * Explicit flag distinguishing "never expires" (`false`) from "no date chosen"
   * (omitted → server defaults to 30 days). When `expires` is `false`, no
   * `expiresAt` is persisted even if the field is absent. (4.1/never-expire fix)
   */
  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  expires?: boolean;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateApiKeyDTO extends PartialType(CreateApiKeyDTO) {
  @IsMongoId()
  _id!: string;
}
