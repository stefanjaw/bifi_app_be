import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for a read-by entry on a progress note */
export class ReadByDTO {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

/** DTO for creating a new progress note */
export class ProgressNoteDTO {
  @IsMongoId()
  @IsNotEmpty()
  careContinuumId!: string;

  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  contentTitle!: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsArray()
  @IsOptional()
  notes?: string[];

  @IsArray()
  @IsOptional()
  readBy?: ReadByDTO[];

  @IsString()
  @IsNotEmpty()
  byName!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  progressNoteType?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing progress note */
export class UpdateProgressNoteDTO extends PartialType(ProgressNoteDTO) {
  @IsMongoId()
  _id!: string;
}
