import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

export class BedDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsMongoId()
  @IsNotEmpty()
  roomId!: string;

  @IsMongoId()
  @IsOptional()
  patientId?: string;

  @IsMongoId()
  @IsOptional()
  reservationId?: string;

  @IsEnum(["taken", "reserved", "empty"])
  @IsOptional()
  stateCode?: "taken" | "reserved" | "empty";

  @IsEnum(["Taken", "Reserved", "Empty"])
  @IsOptional()
  state?: "Taken" | "Reserved" | "Empty";

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateBedDTO extends PartialType(BedDTO) {
  @IsMongoId()
  _id!: string;
}
