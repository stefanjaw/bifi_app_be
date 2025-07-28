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

// To verify from the facility dto
export class FacilityRoomDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;

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
  @IsOptional()
  facilityId!: string;

  @IsOptional()
  active?: string;
}

export class FacilityDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  mainPlace!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Transform(({ value }) =>
    JSON.parse(value).map((room: any) => plainToInstance(FacilityRoomDTO, room))
  )
  @Type(() => FacilityRoomDTO)
  @ValidateNested({ each: true })
  rooms?: FacilityRoomDTO[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateFacilityDTO extends PartialType(FacilityDTO) {
  @IsMongoId()
  _id!: string;
}
