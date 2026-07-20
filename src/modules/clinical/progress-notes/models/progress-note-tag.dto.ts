import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new progress-note-tag */
export class ProgressNoteTagDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing progress-note-tag */
export class UpdateProgressNoteTagDTO extends PartialType(ProgressNoteTagDTO) {
  @IsMongoId()
  _id!: string;
}
