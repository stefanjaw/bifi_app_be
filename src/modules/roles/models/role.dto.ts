import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { PartialType } from "../../../system";
import { plainToInstance, Transform, Type } from "class-transformer";

export class RolePolicyDTO {
  @IsMongoId()
  policyId!: string;

  @IsArray()
  @IsOptional()
  @IsEnum(["create", "read", "update", "delete"], { each: true })
  actions!: string[];
}

export class RoleDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((policy: any) =>
      plainToInstance(RolePolicyDTO, policy)
    )
  )
  @Type(() => RolePolicyDTO)
  @ValidateNested({ each: true })
  policies!: RolePolicyDTO[]; // Assuming policies are represented as an array of MongoDB ObjectIds

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateRoleDTO extends PartialType(RoleDTO) {
  @IsMongoId()
  _id!: string;
}
