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
