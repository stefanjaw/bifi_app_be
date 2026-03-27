import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { FileUpload } from "../../../system";

export class BugReportDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  appModule?: string;

  @IsOptional()
  attachments?: FileUpload;
}
