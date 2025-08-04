import {
  IsEmail,
  IsEnum,
  IsFirebasePushId,
  IsMongoId,
  IsNotEmpty,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class UserDTO {
  @IsEnum(["google", "email"])
  provider!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;
}

export class UpdateUserDTO extends PartialType(UserDTO) {
  @IsMongoId()
  _id!: string;
}
