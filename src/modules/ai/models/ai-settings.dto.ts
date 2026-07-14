import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export class PromptVersionDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsNumber()
  @IsOptional()
  version?: number;
}

export class AiSettingsDTO {
  @IsString()
  @IsOptional()
  aiProvider?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  embeddingModel?: string;

  @IsNumber()
  @IsOptional()
  maxTokenLimit?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptVersionDTO)
  @IsOptional()
  promptVersions?: PromptVersionDTO[];
}
