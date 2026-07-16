import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

/** DTO for creating a new care continuum problem record */
export class ProblemDTO {
  @IsMongoId() @IsNotEmpty() careContinuumId!: string;
  @IsMongoId() @IsNotEmpty() patientId!: string;
  @IsString() @IsNotEmpty() contentBody!: string;
  @IsString() @IsNotEmpty() byName!: string;
  @IsEnum(["active", "resolved", "voided"]) @IsNotEmpty() state!: string;
  @IsString() @IsOptional() comment?: string;
  @IsDate() @IsOptional() @Type(() => Date) diagnosedDate?: Date;
  @IsDate() @IsOptional() @Type(() => Date) resolvedDate?: Date;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing care continuum problem record */
export class UpdateProblemDTO extends PartialType(ProblemDTO) {
  @IsMongoId() _id!: string;
}
