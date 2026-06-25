import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../../system";

export class MedioPagoDTO {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateMedioPagoDTO extends PartialType(MedioPagoDTO) {
  @IsMongoId()
  _id!: string;
}
