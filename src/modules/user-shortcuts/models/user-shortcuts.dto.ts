import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ShortcutItemDTO {
  @IsString()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  routerLink?: string[];

  @IsString()
  @IsOptional()
  resource?: string;
}

export class UserShortcutsDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShortcutItemDTO)
  @IsOptional()
  shortcuts?: ShortcutItemDTO[];
}
