import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class TicketRuleDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(["name", "description", "category", "appModule", "type", "tags"])
  field!: "name" | "description" | "category" | "appModule" | "type" | "tags";

  @IsNotEmpty()
  @IsEnum(["contains", "equals", "startsWith", "endsWith"])
  operator!: "contains" | "equals" | "startsWith" | "endsWith";

  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsNotEmpty()
  @IsEnum(["setAssigned", "setPriority"])
  action!: "setAssigned" | "setPriority";

  @IsNotEmpty()
  @IsString()
  actionValue!: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTicketRuleDTO extends TicketRuleDTO {
  @IsNotEmpty()
  @IsMongoId()
  _id!: string;
}
