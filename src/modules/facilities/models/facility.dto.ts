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
import { PartialType } from "../../../system";
import { RoomDTO } from "./room.dto";

// To verify from the facility dto
export class FacilityRoomInformationDTO extends RoomDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
}

export class FacilityDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  contactId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Transform(({ value }) =>
    JSON.parse(value).map((room: any) =>
      plainToInstance(FacilityRoomInformationDTO, room)
    )
  )
  @Type(() => FacilityRoomInformationDTO)
  @ValidateNested({ each: true })
  rooms?: FacilityRoomInformationDTO[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateFacilityDTO extends PartialType(FacilityDTO) {
  @IsMongoId()
  _id!: string;
}
