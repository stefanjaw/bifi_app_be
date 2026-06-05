import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";

export class CrEinvoiceSettingsDTO {
  @IsString()
  @IsOptional()
  proveedorSistemas?: string;

  @IsString()
  @IsOptional()
  haciendaUsername?: string;

  @IsString()
  @IsOptional()
  haciendaPassword?: string;

  @IsString()
  @IsOptional()
  certificateBase64?: string;

  @IsString()
  @IsOptional()
  certificatePassword?: string;

  @IsEnum(["production", "sandbox"])
  @IsOptional()
  haciendaEnvironment?: "production" | "sandbox";

  @IsString()
  @IsOptional()
  codigoEstablecimiento?: string;

  @IsString()
  @IsOptional()
  codigoPuntoVenta?: string;

  @IsString()
  @IsOptional()
  feVersion?: string;

  @IsMongoId()
  @IsOptional()
  emisorCompanyId?: string;
}
