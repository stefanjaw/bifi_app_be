import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for a staff member entry within a group */
export class StaffIdDTO {
  @IsMongoId()
  @IsNotEmpty()
  staff_id!: string;

  @IsEnum(["Supervisor", "Nurse", "Caregiver", "Charge Nurse"])
  role!: "Supervisor" | "Nurse" | "Caregiver" | "Charge Nurse";
}

/** DTO for creating a new staff group */
export class GroupDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffIdDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  staff_ids?: StaffIdDTO[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing staff group */
export class UpdateGroupDTO extends PartialType(GroupDTO) {
  @IsMongoId()
  _id!: string;
}
