import { plainToInstance, Transform, Type } from "class-transformer";
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
  value!: unknown;
}

export class PolicyDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  resource!: string;

  @IsEnum(["model", "view", "menu"])
  type!: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((room: any) =>
      plainToInstance(ConditionDTO, room),
    ),
  )
  @Type(() => ConditionDTO)
  @ValidateNested({ each: true })
  conditions?: ConditionDTO[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdatePolicyDTO extends PartialType(PolicyDTO) {
  @IsMongoId()
  _id!: string;
}
