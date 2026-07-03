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
} from "class-validator";
import { PartialType } from "../../../system";

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

export class CrEconomicActivityCodeDTO {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

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

  @IsMongoId()
  @IsOptional()
  parentId?: string;

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

  @IsEnum(["01", "02", "03", "04", "05", "06"])
  @IsOptional()
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
  photo?: unknown;

  @IsOptional()
  active?: boolean;
}

export class UpdateContactDTO extends PartialType(ContactDTO) {
  @IsMongoId()
  _id!: string;
}
