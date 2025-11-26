import { IsMongoId, IsNotEmpty, IsString } from "class-validator";
import { PartialType } from "../../../system";

export class ReportingDTO {
  @IsString()
  @IsNotEmpty()
  //   @Matches(/^<(\w+)\b[^>]*>.*?<\/\1>$/, { message: "Invalid HTML structure" })
  template!: string;

  @IsString()
  @IsNotEmpty()
  model!: string;
}

export class UpdateReportingDTO extends PartialType(ReportingDTO) {
  @IsMongoId()
  _id!: string;
}
