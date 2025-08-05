import {
  IsEmail,
  IsEnum,
  IsFirebasePushId,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class UserDTO {
  @IsEnum(["google.com", "password"])
  provider!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  picture?: string;

  // @IsString()
  // @IsNotEmpty()
  // name!: string;

  // @IsString()
  // @IsNotEmpty()
  // lastName!: string;
}

export class UpdateUserDTO extends PartialType(UserDTO) {
  @IsMongoId()
  _id!: string;
}
