import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class RoomDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsMongoId()
  facilityId!: string;

  @IsOptional()
  active?: string;
}

export class UpdateRoomDTO extends PartialType(RoomDTO) {
  @IsMongoId()
  _id!: string;
}
