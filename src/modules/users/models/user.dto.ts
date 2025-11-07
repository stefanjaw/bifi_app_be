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
import { ContactDTO } from "../../contacts/models/contact.dto";

export class UserContactInformationDTO extends ContactDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
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

  @IsOptional()
  uploadedPictureId?: unknown;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  roles?: string[];

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @Transform(({ value }) =>
    plainToInstance(UserContactInformationDTO, JSON.parse(value))
  )
  @Type(() => UserContactInformationDTO)
  @ValidateNested()
  @IsOptional()
  contactInformation?: UserContactInformationDTO;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateUserDTO extends PartialType(UserDTO) {
  @IsMongoId()
  _id!: string;
}
