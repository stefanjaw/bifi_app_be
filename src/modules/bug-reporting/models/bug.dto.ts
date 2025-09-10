import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { FileUpload } from "../../../system";

export class BugDTO {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  files?: FileUpload;

  // startDate!: Date;
  // typeId!: string;
  // projectId!: string;
}
