import { Transform } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsEnum,
  ValidateIf,
  IsPostalCode,
  IsUrl,
} from "class-validator";
import { PartialType } from "../../../system";

export class ContactDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((obj) => obj.type === "individual")
  lastName!: string;

  // @IsPhoneNumber("BM")
  @IsString()
  @IsOptional()
  phoneNumber!: string;

  @IsEmail()
  @IsOptional()
  email!: string;

  @IsUrl()
  @ValidateIf((obj) => obj.type === "company")
  website?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsEnum(["individual", "company"])
  type!: "individual" | "company";

  @IsMongoId()
  @IsOptional()
  countryId?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  @IsPostalCode("any")
  zipCode?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  streetAddress2?: string;

  @IsMongoId({ each: true })
  @Transform(({ value }) => typeof value === "string" ? JSON.parse(value) : value)
  @IsOptional()
  childIds?: string[];

  @IsOptional()
  active?: boolean;
}

export class UpdateContactDTO extends PartialType(ContactDTO) {
  @IsMongoId()
  _id!: string;
}
