import { IsString, IsOptional } from "class-validator";

export class DriveSettingsDTO {
  @IsString()
  @IsOptional()
  serviceAccountKey?: string;
}
