import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";
import { RoomDTO } from "./room.dto";

export class FacilityRoomInformationDTO extends RoomDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
}

export class FacilityDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsMongoId()
  @IsOptional()
  contactId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((room: any) =>
      plainToInstance(FacilityRoomInformationDTO, room),
    ),
  )
  @Type(() => FacilityRoomInformationDTO)
  @ValidateNested({ each: true })
  rooms?: FacilityRoomInformationDTO[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateFacilityDTO extends PartialType(FacilityDTO) {
  @IsMongoId()
  _id!: string;
}
