import { plainToInstance, Transform, Type } from "class-transformer";
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
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDate,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";
import { FileUpload } from "../../../system/libraries/file-storage/file-upload.types";

/** Validator that ensures at least one contact method (phone, email, or website for companies) is provided */
@ValidatorConstraint({ name: "atLeastOneContact", async: false })
export class AtLeastOneContactConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;

    const hasPhone = !!obj.phoneNumber?.trim();
    const hasEmail = !!obj.email?.trim();
    // Website solo cuenta si es company
    const hasWebsite = obj.type === "company" && !!obj.website?.trim();

    return hasPhone || hasEmail || hasWebsite;
  }

  defaultMessage() {
    return "At least one contact method (phone number, email, or website for companies) must be provided.";
  }
}

/** DTO for a Costa Rica economic activity code and description */
export class CrEconomicActivityCodeDTO {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

/** DTO for an emergency contact associated with a contact record */
export class EmergencyContactDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  relationShip?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

/** DTO for creating a new contact (individual or company) */
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
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((obj) => obj.parentId != null && obj.parentId !== "")
  @IsMongoId()
  parentId?: string | null;

  @Validate(AtLeastOneContactConstraint)
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

  @IsString()
  @IsOptional()
  vat?: string;

  @IsOptional()
  @IsEnum(["01", "02", "03", "04", "05", "06"])
  @Transform(({ value }) => (value === "" ? undefined : value))
  crVatType?: "01" | "02" | "03" | "04" | "05" | "06";

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrEconomicActivityCodeDTO)
  @IsOptional()
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(CrEconomicActivityCodeDTO, item),
    ),
  )
  crEconomicActivityCodes?: CrEconomicActivityCodeDTO[];

  @IsString()
  @IsOptional()
  commercialName?: string;

  @IsString()
  @IsOptional()
  crDistrito?: string;

  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  @IsOptional()
  childIds?: string[];

  @IsOptional()
  photo?: FileUpload;

  @IsString()
  @IsOptional()
  clMiddleName?: string;

  @IsString()
  @IsOptional()
  clOrganizationName?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  clDob?: Date;

  @IsMongoId()
  @IsOptional()
  clGenderId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDTO)
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clEmergencyContact?: EmergencyContactDTO;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  clIsResident?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  clIsStaff?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  clIsVendor?: boolean;

  @IsOptional()
  active?: boolean;
}

/** DTO for updating an existing contact — all fields optional except _id */
export class UpdateContactDTO extends PartialType(ContactDTO) {
  @IsMongoId()
  _id!: string;
}
