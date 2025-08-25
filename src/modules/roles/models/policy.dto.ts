import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType } from "../../../system";

export class ConditionDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsEnum(["==", "!=", ">", "<", "in"])
  operator!: string;

  @IsNotEmpty()
  value!: any;
}

export class PolicyDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  resource!: string;

  @IsString()
  @IsEnum(["create", "read", "update", "delete"])
  action!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  @Transform(({ value }) =>
    JSON.parse(value).map((room: any) => plainToInstance(ConditionDTO, room))
  )
  @Type(() => ConditionDTO)
  @ValidateNested({ each: true })
  conditions?: ConditionDTO[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdatePolicyDTO extends PartialType(PolicyDTO) {
  @IsMongoId()
  _id!: string;
}
