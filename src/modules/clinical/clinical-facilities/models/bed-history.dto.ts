import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

export class BedHistoryDTO {
  @IsString()
  @IsNotEmpty()
  action!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsNotEmpty()
  bedId!: string;

  @IsBoolean()
  @Transform(toBoolean)
  effective!: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateBedHistoryDTO extends PartialType(BedHistoryDTO) {
  @IsMongoId()
  _id!: string;
}
