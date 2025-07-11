import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsPhoneNumber,
} from "class-validator";
import { PartialType } from "../../../system";

export class ContactDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsPhoneNumber("BM")
  phoneNumber!: string;

  @IsEmail()
  email!: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateContactDTO extends PartialType(ContactDTO) {
  @IsMongoId()
  _id!: string;
}
