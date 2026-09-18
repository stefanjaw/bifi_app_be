import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

/** Payload for `POST /accounting/gl/closing-entries` (Phase L2b) */
export class ClosingEntriesDTO {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/)
  period!: string;

  /** Optional currency filter (aggregation only posts journals in that currency) */
  @IsOptional()
  @IsMongoId()
  currencyId?: string;
}
