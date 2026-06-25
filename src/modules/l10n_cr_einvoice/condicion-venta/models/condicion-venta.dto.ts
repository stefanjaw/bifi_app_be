import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../../system";

export class CondicionVentaDTO {
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

export class UpdateCondicionVentaDTO extends PartialType(CondicionVentaDTO) {
  @IsMongoId()
  _id!: string;
}
