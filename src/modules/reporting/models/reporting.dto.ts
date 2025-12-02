import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";
import { Type } from "class-transformer";

export class ReportingDTO {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  //   @Matches(/^<(\w+)\b[^>]*>.*?<\/\1>$/, { message: "Invalid HTML structure" })
  template!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateReportingDTO extends PartialType(ReportingDTO) {
  @IsMongoId()
  _id!: string;
}
