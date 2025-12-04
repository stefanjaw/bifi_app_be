import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
import { PartialType } from "../../../system";

export class TemplateDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  codeOriginal?: string;

  @IsString()
  @IsOptional()
  codeCustom!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\.{1,2}\/)?(?:[a-zA-Z0-9_\-]+\/)*[a-zA-Z0-9_\-]+\/?$/, {
    message: "Directory must have a valid format './folder/folder'",
  })
  directory!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9._-]+\.(ts|js|html|css)$/, {
    message: "Filename must have a valid format: 'file-name.ts'",
  })
  filename!: string;

  @IsEnum([
    "text/typescript",
    "application/typescript",
    "application/javascript",
    "text/javascript",
    "text/html",
    "text/css",
  ])
  mimeType!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateTemplateDTO extends PartialType(TemplateDTO) {
  @IsMongoId()
  _id!: string;
}
