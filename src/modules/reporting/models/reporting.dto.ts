import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";
import { Transform } from "class-transformer";

export class ReportingDTO {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  template!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateReportingDTO extends PartialType(ReportingDTO) {
  @IsMongoId()
  _id!: string;
}
