import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

export class CreateTranslationDTO {
  @IsString()
  @IsNotEmpty()
  locale!: string;

  @IsString()
  @IsNotEmpty()
  scope!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateTranslationDTO extends PartialType(CreateTranslationDTO) {}
