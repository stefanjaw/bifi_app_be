import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GenAIDTO {
  @IsString()
  @IsNotEmpty()
  question!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  context?: string;
}
