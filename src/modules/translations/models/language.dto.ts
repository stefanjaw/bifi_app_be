import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

export class CreateLanguageDTO {
  @IsString()
  @IsNotEmpty()
  locale!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  nativeName!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateLanguageDTO extends PartialType(CreateLanguageDTO) {}
