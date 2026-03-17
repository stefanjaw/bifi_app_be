import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
} from "class-validator";

export class GemsDTO {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  context?: string;
}

export class GemsEmbedDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  text?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsOptional()
  texts?: string[];
}
