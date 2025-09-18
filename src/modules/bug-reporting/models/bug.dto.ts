import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { FileUpload } from "../../../system";

export class BugDTO {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  platform!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  files?: FileUpload;

  // startDate!: Date;
  // typeId!: string;
  // projectId!: string;
}
