import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";
import { plainToInstance, Transform, Type } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** A single history record entry (social, family, medical, surgical) */
export class HistoryEntry {
  @IsOptional() @IsString() description?: string;
}

/** A single medication record entry */
export class MedicationEntry {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() uomId?: string;
  @IsOptional() @IsString() strength?: string;
  @IsOptional() @IsString() routeId?: string;
  @IsOptional() @IsString() frequencyId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) duration?: number;
  @IsOptional() @IsString() durationUnit?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsNumber() @Type(() => Number) quantity?: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

/** A single allergy record entry */
export class AllergyEntry {
  @IsOptional() @IsString() medicalAllergyId?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() severity?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

/** A single immunization record entry */
export class ImmunizationEntry {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() dateGiven?: string;
  @IsOptional() @IsString() lotCode?: string;
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsNumber() @Type(() => Number) totalDoses?: number;
  @IsOptional() @IsNumber() @Type(() => Number) dosesGiven?: number;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

/** A single precaution record entry */
export class PrecautionEntry {
  @IsOptional() @IsString() medicalPrecautionId?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}

/** Health care proxy contact reference */
export class HealthCareProxyEntry {
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() relationShip?: string;
}

/** External provider reference */
export class ExternalProviderEntry {
  @IsOptional() @IsString() contactId?: string;
  @IsOptional() @IsString() providerType?: string;
}

/** An advance directive document entry */
export class AdvanceDirectiveEntry {
  @IsOptional() @IsArray() @IsString({ each: true }) types?: string[];
  @IsOptional() @IsBoolean() outdated?: boolean;
  @IsOptional() @IsString() information?: string;
}

/** DTO for creating a new care continuum record */
export class CareContinuumDTO {
  @IsMongoId() @IsNotEmpty() patientId!: string;
  @IsEnum(["Transfer", "Care Update", "Discharge", "Admission"])
  @IsNotEmpty()
  typeOfEvent!: string;
  @IsMongoId() @IsOptional() careContinuumLevelId?: string;
  @IsEnum(["Draft", "Active", "Discharge"]) @IsOptional() state?: string;
  @IsMongoId() @IsOptional() transferPoint?: string;
  @IsMongoId() @IsOptional() assignedCaregiver?: string;
  @IsMongoId() @IsOptional() assignedNurse?: string;
  @IsMongoId() @IsOptional() unitId?: string;
  @IsMongoId() @IsOptional() bedId?: string;
  @IsMongoId() @IsOptional() roomId?: string;
  @IsString() @IsNotEmpty() insuranceCarrier!: string;
  @IsString() @IsOptional() planNumber?: string;
  @IsString() @IsOptional() groupNumber?: string;
  @IsString() @IsNotEmpty() policyNumber!: string;
  @IsString() @IsOptional() memberId?: string;
  @IsDate() @IsOptional() @Type(() => Date) effectiveDate?: Date;
  @IsDate() @IsNotEmpty() @Type(() => Date) endDate!: Date;
  @IsMongoId() @IsOptional() genderAtBirth?: string;
  @IsMongoId() @IsOptional() genderAtPresent?: string;
  @IsMongoId() @IsOptional() race?: string;
  @IsNumber() @IsOptional() @Type(() => Number) height?: number;
  @IsNumber() @IsOptional() @Type(() => Number) weight?: number;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(HistoryEntry, v))
      : (value?.map?.((v: any) => plainToInstance(HistoryEntry, v)) ?? value),
  )
  socialHistory?: HistoryEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(HistoryEntry, v))
      : (value?.map?.((v: any) => plainToInstance(HistoryEntry, v)) ?? value),
  )
  familyHistory?: HistoryEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(HistoryEntry, v))
      : (value?.map?.((v: any) => plainToInstance(HistoryEntry, v)) ?? value),
  )
  medicalHistory?: HistoryEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => HistoryEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(HistoryEntry, v))
      : (value?.map?.((v: any) => plainToInstance(HistoryEntry, v)) ?? value),
  )
  surgicalHistory?: HistoryEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MedicationEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(MedicationEntry, v))
      : (value?.map?.((v: any) => plainToInstance(MedicationEntry, v)) ??
        value),
  )
  medications?: MedicationEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AllergyEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(AllergyEntry, v))
      : (value?.map?.((v: any) => plainToInstance(AllergyEntry, v)) ?? value),
  )
  allergies?: AllergyEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ImmunizationEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(ImmunizationEntry, v))
      : (value?.map?.((v: any) => plainToInstance(ImmunizationEntry, v)) ??
        value),
  )
  immunizations?: ImmunizationEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PrecautionEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) => plainToInstance(PrecautionEntry, v))
      : (value?.map?.((v: any) => plainToInstance(PrecautionEntry, v)) ??
        value),
  )
  precautions?: PrecautionEntry[];
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthCareProxyEntry)
  @Transform(({ value }) =>
    plainToInstance(
      HealthCareProxyEntry,
      typeof value === "string" ? JSON.parse(value) : value,
    ),
  )
  healthCareProxy?: HealthCareProxyEntry;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExternalProviderEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) =>
          plainToInstance(ExternalProviderEntry, v),
        )
      : (value?.map?.((v: any) => plainToInstance(ExternalProviderEntry, v)) ??
        value),
  )
  externalProviders?: ExternalProviderEntry[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AdvanceDirectiveEntry)
  @Transform(({ value }) =>
    typeof value === "string"
      ? JSON.parse(value).map((v: any) =>
          plainToInstance(AdvanceDirectiveEntry, v),
        )
      : (value?.map?.((v: any) => plainToInstance(AdvanceDirectiveEntry, v)) ??
        value),
  )
  advanceDirectives?: AdvanceDirectiveEntry[];
  @IsOptional()
  extraFields?: Record<string, unknown>;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing care continuum record */
export class UpdateCareContinuumDTO extends PartialType(CareContinuumDTO) {
  @IsMongoId() _id!: string;
}
