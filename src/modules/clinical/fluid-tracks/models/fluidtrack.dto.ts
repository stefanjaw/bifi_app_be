import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new fluid track record */
export class FluidTrackDTO {
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dayFluidTrack!: Date;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  fluidTracks?: string[];

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

/** DTO for updating an existing fluid track record */
export class UpdateFluidTrackDTO extends PartialType(FluidTrackDTO) {
  @IsMongoId()
  _id!: string;
}
