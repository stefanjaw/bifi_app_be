import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for a single fluid track entry */
export class TrackItemDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateFluidTrack?: Date;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;

  @IsMongoId()
  @IsOptional()
  patientProgressNoteId?: string;
}

/** DTO for creating a new fluid track item */
export class FluidTrackItemDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackItemDTO)
  @IsOptional()
  tracks?: TrackItemDTO[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing fluid track item */
export class UpdateFluidTrackItemDTO extends PartialType(FluidTrackItemDTO) {
  @IsMongoId()
  _id!: string;
}
