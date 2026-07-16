import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for a weekday entry within a shift */
export class WeekdayDTO {
  @IsEnum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ])
  @IsOptional()
  weekday?:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  group_ids?: string[];
}

/** DTO for creating a new shift */
export class ShiftDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  @IsOptional()
  manager?: string;

  @IsString()
  @IsNotEmpty()
  time_start!: string;

  @IsString()
  @IsNotEmpty()
  time_end!: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date_start!: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date_end?: Date;

  @IsEnum(["Morning", "Evening", "Afternoon"])
  type!: "Morning" | "Evening" | "Afternoon";

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeekdayDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  weekdays?: WeekdayDTO[];

  @IsMongoId()
  @IsOptional()
  staffId?: string;

  @IsMongoId()
  @IsOptional()
  patientId?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing shift */
export class UpdateShiftDTO extends PartialType(ShiftDTO) {
  @IsMongoId()
  _id!: string;
}
