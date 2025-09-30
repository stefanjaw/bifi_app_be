import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType } from "../../../system";
import { plainToInstance, Transform, Type } from "class-transformer";

export class UserContactDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  // @IsPhoneNumber("BM")
  @IsString()
  @IsOptional()
  phoneNumber!: string;

  @IsEmail()
  @IsOptional()
  email!: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsOptional()
  active?: boolean;
}

export class UserDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  authId!: string;

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

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  roles?: string[];

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @Transform(({ value }) => plainToInstance(UserContactDTO, JSON.parse(value)))
  @Type(() => UserContactDTO)
  @ValidateNested()
  @IsOptional()
  contactInformation?: UserContactDTO;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateUserDTO extends PartialType(UserDTO) {
  @IsMongoId()
  _id!: string;
}
