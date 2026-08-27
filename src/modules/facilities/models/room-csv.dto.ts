import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { toBoolean } from "../../../system";

export class RoomCSVDTO {
  @IsMongoId()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  facilityId?: string;

  @IsMongoId()
  @IsOptional()
  clGenderId?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  active?: boolean;
}
