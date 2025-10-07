import { Transform } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsEnum,
  ValidateIf,
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

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsEnum(["individual", "company"])
  type!: "individual" | "company";

  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  childIds?: string[];

  @IsOptional()
  active?: boolean;
}

export class UpdateContactDTO extends PartialType(ContactDTO) {
  @IsMongoId()
  _id!: string;
}
