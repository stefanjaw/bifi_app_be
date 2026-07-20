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
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new note */
export class NoteDTO {
  @IsMongoId()
  @IsNotEmpty()
  careContinuumId!: string;

  @IsMongoId()
  @IsNotEmpty()
  progressNoteId!: string;

  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsString()
  @IsNotEmpty()
  contentBody!: string;

  @IsString()
  @IsNotEmpty()
  byName!: string;

  @IsString()
  @IsNotEmpty()
  state!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsArray()
  @IsOptional()
  progressNoteTagIds?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing note */
export class UpdateNoteDTO extends PartialType(NoteDTO) {
  @IsMongoId()
  _id!: string;
}
