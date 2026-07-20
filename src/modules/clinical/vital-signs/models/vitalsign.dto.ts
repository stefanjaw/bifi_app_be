import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for a single measured vital reading */
export class MeasuredVitalDTO {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsMongoId()
  @IsOptional()
  vitalSignTypeId?: string;
}

/** DTO for creating a new vital sign record */
export class VitalSignDTO {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateVital?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasuredVitalDTO)
  @IsOptional()
  measuredVitals?: MeasuredVitalDTO[];

  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

  @IsMongoId()
  @IsOptional()
  createdBy?: string;

  @IsMongoId()
  @IsOptional()
  updatedBy?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing vital sign record */
export class UpdateVitalSignDTO extends PartialType(VitalSignDTO) {
  @IsMongoId()
  _id!: string;
}
