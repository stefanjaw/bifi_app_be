import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  ValidateNested,
} from "class-validator";
import { ExtractedLineDTO } from "./invoice.dto";

export class HScodeDTO {
  @ValidateNested({ each: true })
  @Type(() => ExtractedLineDTO)
  @ArrayMinSize(1)
  @IsArray()
  @Transform(({ value }) => {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed.map((invoice: any) =>
      plainToInstance(ExtractedLineDTO, invoice)
    );
  })
  lines!: ExtractedLineDTO[];
}
