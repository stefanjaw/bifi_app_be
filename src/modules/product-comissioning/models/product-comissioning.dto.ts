import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class ProductComissioningDTO {
  @IsIn(["fail", "pass"])
  outcome!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  details?: string;

  // @IsArray()
  // @ArrayMinSize(1)
  // @IsOptional()
  // @Transform(({ value }) =>
  //   JSON.parse(value).map((room: any) => plainToInstance(FileDTO, room))
  // )
  // @Type(() => FileDTO)
  // @ValidateNested({ each: true })
  // attachments?: FileDTO[];

  @IsMongoId()
  productId!: string;

  @IsOptional()
  active?: string;
}

export class UpdateProductComissioningDTO extends PartialType(
  ProductComissioningDTO
) {
  @IsMongoId()
  _id!: string;
}
