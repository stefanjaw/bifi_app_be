import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";
import { Transform, Type } from "class-transformer";

export class RoleDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  policies!: string[]; // Assuming policies are represented as an array of MongoDB ObjectIds

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateRoleDTO extends PartialType(RoleDTO) {
  @IsMongoId()
  _id!: string;
}
