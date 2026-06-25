import {
  CustomsTariffDocument,
  ShippingDocument,
  ShippingInvoicePdfExtractedDatumLine,
  ShippingInvoicePdfExtractedDatumLineTariff,
} from "@mongodb-types";
import {
  BaseService,
  InternalServerException,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { shippingModel } from "../models/shipping.model";
import mongoose, { ClientSession } from "mongoose";
import { ShippingDTO, UpdateShippingDTO } from "../models/shipping.dto";
import { GenAIService } from "../../ai/genai/services/genai-service";
import { CountryService } from "../../countries/services/country-service";
import { shippingGenAISchema } from "../models/shipping.schema";
import { HScodeDTO } from "../models/hs-code.dto";
import { linesGenAISchema } from "../models/invoice.schema";
import { CustomsTariffService } from "../../customs-tariffs";
import { CustomsHeadingService } from "../../customs-headings";
import { CustomsChapterService } from "../../customs-chapters";

export class ShippingService extends BaseService<ShippingDocument> {
  // constants
  private readonly GENAI_CONTEXT = ` 
      You are a financial advisor with an expertise in understanding invoices and shippings.
      You will receive a single input document as an invoice and shipping &
      you will have to answer questions based on the input document.
  `;

  private readonly GENAI_GENERATE_SHIPPING_MESSAGE = ` 
      Your task is to extract structured data from the provided PDF documents and return a single JSON object
      based on the schema provided to you.

      Response rules (MANDATORY):
      - Return ONLY a valid JSON object.
      - Do NOT include explanations, comments, markdown, or extra text.
      - The response must be directly consumable by JSON.parse.
      - The JSON output MUST strictly conform to the schema provided to you.
      - Do not invent fields that are not defined in the schema.
      - Do not omit required fields.
      - Do not change enum values.
      - Do not return null for required fields.

      General instructions:
      - All dates must be valid ISO date strings.
      - All numeric values must be numbers, not strings.
      - All ObjectId references must be returned as strings.
      - Arrays that are required must never be empty.
      - For countries, use the _id field based on the countries
        collections provided to you in prompt.

      Header rules:
      - The header object represents the main invoice metadata.
      - The invoice identifier (invoiceNumber or equivalent) MUST always be present and must 
        be transcribed exactly as shown in the document.
      - Do not generate fake identifiers, use correct ones.

      Lines rules:
      - The lines array represents every charge, item, fee, or payment present in the document.
      - The lines array MUST NOT be empty.
      - Every line must include a customsClassification field containing a short, concrete, human-readable product descriptor,
        must infer the most accurate HS customs classification possible.
        Examples: "Fresh apples", "Electric toaster", "Air fryer", "Live horses".
      - The description must be specific, not generic, for a better matching.

      Harmonized System (HS) rules:
      - For each line, infer the most accurate HS classification possible.
      - Provide the following fields when an HS code applies:
        - hsCode
        - chapterDescription
        - headingDescription
        - subheadingDescription
      - The hsCode must contain exactly 7 digits, with no dots, spaces, or separators.
      - If an item cannot reasonably be classified, leave HS-related fields as null.

      Tariff rules:
      - The tariff object must follow the required structure.
      - All tariff fields MUST be present but set to null.

      Record number:
      - The recordNumber field MUST always be null.

      Final validation:
      - The final JSON MUST strictly match the provided schema.
      - Any deviation from the schema will be considered an error.

      IMPORTANT:
      - Respond ONLY with raw JSON
      - DO NOT use markdown
      - DO NOT wrap the response in \`\`\`json
      - The response MUST strictly follow the provided schema
      - Do not add extra fields
      - If you understand these instructions, respond with the JSON object only.
      - If more than one document is provided, combine all information into a single JSON object, where each document 
        represents a different invoice in the invoice array, this in the order they are provided.
      - If any required information is missing from the documents, set the corresponding fields to a random value but correct format.
  `;

  private readonly GENAI_GENERATE_HS_CODE_MESSAGE = ` 
      You will receive an existing JSON object representing the lines of an invoice.
      That JSON MUST be treated as the source of truth.

      Your task is to UPDATE ONLY specific HS-related fields
      inside EACH line object and return the FULL JSON object as a response 
      based on the schema provided to you.

      --------------------------------------------------
      STRICT UPDATE RULES
      --------------------------------------------------
      - You MUST preserve the original structure.
      - You MUST NOT remove, rename, or add fields.
      - You MUST NOT reorder arrays.
      - You MUST NOT modify values of any field
        EXCEPT the HS-related fields listed below.
      - Any field not explicitly listed MUST remain EXACTLY the same
        as in the input JSON.

      --------------------------------------------------
      FIELDS YOU ARE ALLOWED TO MODIFY (PER LINE)
      --------------------------------------------------
      Only the following fields may be changed, added, or removed
      for each line object, if hsCode is applicable for that line
      you must provide values for ALL of them, use description or 
      classification if you can't find the hsCode to help you find 
      the correct code, otherwise set them to null. Sometimes you 
      set the hs code but the rest of the fields are blank, avoid 
      that, if you set the hs code you MUST set the rest of the fields too.
      If you consider hsCode and related fields if present are incorrect,
      you MUST update them with the correct values.

      This are the fields you can modify:

      - hsCode
      - customsClassification (if not present, use description to infer it or hsCode if present)
      - customsChapter
      - customsHeading
      - customsSubheading
      - chapterDescription
      - headingDescription
      - subheadingDescription

      --------------------------------------------------
      HS CLASSIFICATION RULES
      --------------------------------------------------
      - Infer the HS classification using the existing
        "customsClassification" field of each line.
      - "customsClassification" itself MUST NOT be modified.
      - If you find already hs codes and think they can be improved, do it.

      - hsCode rules:
        - MUST contain EXACTLY 7 digits.
        - NO dots, spaces, or letters.

      - If hsCode is present:
        - customsChapter MUST be present.
        - customsHeading MUST be present.
        - customsSubheading MUST be present.
        - chapterDescription MUST be present.
        - headingDescription MUST be present.
        - subheadingDescription MUST be present.

      - If the item cannot be reasonably classified under HS:
        - ALL HS-related fields MUST be set to null.

      --------------------------------------------------
      OUTPUT CONSTRAINTS
      --------------------------------------------------
      - Return ONLY the updated JSON object.
      - The output MUST be directly parsable by JSON.parse().
      - Do NOT include explanations, comments, or markdown.
      - Do NOT restate the input.
      - Do NOT return only the hsCode and leave the rest blank, if the hsCode is present
        the rest of the related fields must be present.
  `;

  private readonly GENAI_GENERATE_TARIFF_MESSAGE = ` 
      You will receive an existing JSON object representing the lines of an invoice.
      That JSON MUST be treated as the source of truth.

      Your task is to UPDATE ONLY specific tariff fields
      inside EACH line tariff object and return the FULL JSON object as a response 
      based on the schema provided to you.

      --------------------------------------------------
      STRICT UPDATE RULES
      --------------------------------------------------
      - You MUST preserve the original structure.
      - You MUST NOT remove, rename, or add fields.
      - You MUST NOT reorder arrays.
      - You MUST NOT modify values of any field
        EXCEPT the tariff fields listed below.
      - Any field not explicitly listed MUST remain EXACTLY the same
        as in the input JSON.

      --------------------------------------------------
      FIELDS YOU ARE ALLOWED TO MODIFY (PER LINE)
      --------------------------------------------------      
      Only the following fields may be changed, added, or removed
      for each line object, if tariff is applicable for that line
      you must provide values for ALL of tariff fields, use the line hs code or related fields 
      to infer the tariff field values if applicable, if tariff itself is not blank, use tariff values 
      to update them if applicable. otherwise set them to null. 
      Sometimes you set the tariff.code but the rest of the tariff.fields are blank, avoid 
      that, if you set the tariff.code you MUST set the rest of the fields too.
      If you consider tariff.code and related fields if present are incorrect,
      you MUST update them with the correct values.

      This are the fields you can modify:

      - tariff.code (8 lenght characters)
      - tariff.description
      - tariff.chapter
      - tariff.heading
      - tariff.subheading
      
      --------------------------------------------------
      OUTPUT CONSTRAINTS
      --------------------------------------------------
      - Return ONLY the updated JSON object.
      - The output MUST be directly parsable by JSON.parse().
      - Do NOT include explanations, comments, or markdown.
      - Do NOT restate the input.
      - Do NOT return only the tariff and leave the rest blank, if the code is present
        the rest of the related fields must be present.
  `;

  // services
  private readonly genAIService = new GenAIService();
  private readonly countryService = new CountryService();
  private readonly customsTariffService = new CustomsTariffService();
  private readonly customsHeadingService = new CustomsHeadingService();
  private readonly customsChapterService = new CustomsChapterService();

  constructor() {
    super({
      model: shippingModel,
    });
  }

  /**
   * Builds a lean tariff patch from the DB document.
   * Only includes optional fields when the DB has a value — never injects defaults.
   */
  private buildTariffPatch(
    dbTariff: CustomsTariffDocument
  ): Omit<ShippingInvoicePdfExtractedDatumLineTariff, "_id"> {
    const patch: Omit<ShippingInvoicePdfExtractedDatumLineTariff, "_id"> = {
      code: dbTariff.code,
      chapter: dbTariff.chapter,
      heading: dbTariff.heading,
      subheading: dbTariff.subheading,
      description: dbTariff.description,
    };
    patch.rateOfDuty = dbTariff.rateOfDuty ?? null;
    patch.unitOfMeasurement = dbTariff.unitOfMeasurement ?? null;
    patch.quantity = dbTariff.quantity ?? null;
    return patch;
  }

  /**
   * Applies authoritative DB tariff data onto a lean shipping invoice line object.
   * Always updates HS-code classification fields on the line.
   * Creates or overwrites the tariff subdocument from DB values.
   * Fields from the DB always take precedence over AI-generated values.
   * @param line - The lean line object to enrich (mutated in place).
   * @param dbTariff - The matching tariff document from the DB.
   */
  private applyDbTariffToLine(
    line: ShippingInvoicePdfExtractedDatumLine,
    dbTariff: CustomsTariffDocument
  ): void {
    // Correct authoritative HS code classification fields directly on the line
    line.customsChapter = dbTariff.chapter;
    line.customsHeading = dbTariff.heading;
    line.customsSubheading = dbTariff.subheading;
    line.subheadingDescription = dbTariff.description;

    const patch = this.buildTariffPatch(dbTariff);

    if (line.tariff) {
      // Overwrite existing tariff fields with authoritative DB values
      Object.assign(line.tariff, patch);
    } else {
      // Create a new tariff subdocument from DB values
      line.tariff = {
        _id: new mongoose.Types.ObjectId(),
        ...patch,
      };
    }
  }

  /**
   * Enriches chapter and heading description fields on a lean line using
   * authoritative data from the customs chapters and headings collections.
   * @param line - The lean line object to enrich (mutated in place).
   * @param chapter - Two-digit chapter code (e.g. "01").
   * @param heading - Two-digit heading code (e.g. "01").
   */
  private async enrichLineDescriptions(
    line: ShippingInvoicePdfExtractedDatumLine,
    chapter: string,
    heading: string
  ): Promise<void> {
    const [dbChapter, dbHeading] = await Promise.all([
      this.customsChapterService.lookupByNumber(chapter),
      this.customsHeadingService.lookupByChapterAndHeading(chapter, heading),
    ]);
    if (dbChapter) line.chapterDescription = dbChapter.description;
    if (dbHeading) line.headingDescription = dbHeading.description;
  }

  /**
   * Creates a new shipping record.
   * The record is created with the user who made the request as the createdBy user.
   * The function runs within a transaction and returns the created record.
   * @param data - The data to create the record with.
   * @param session - The optional client session to use for the transaction.
   * @returns The created record document.
   */
  override async create(
    data: ShippingDTO,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    return await super.create(
      { ...data, createdBy: userStorage.getStore()?.user?._id },
      session
    );
  }

  /**
   * Updates a shipping record with the given data.
   * The function runs within a transaction and returns the updated record.
   *
   * @param data - The data to update the record with.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated record document.
   */
  override async update(
    data: UpdateShippingDTO,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    return await super.update(
      { ...data, updatedBy: userStorage.getStore()?.user?._id },
      session
    );
  }

  /**
   * Clones a shipping record.
   *
   * This function runs a transactional operation.
   *
   * @param _id - The id of the shipping record to clone.
   * @param session - Optional mongoose session.
   * @returns The cloned shipping record.
   */
  async cloneShipping(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    const userId = userStorage.getStore()?.user?._id;

    return await runTransaction<ShippingDocument>(
      session,
      async (newSession) => {
        const shipping = await super.getById(_id, newSession);

        return await super.create(
          {
            ...shipping?.toObject(),
            createdBy: userId,
          },
          newSession
        );
      }
    );
  }

  /**
   * Generates a shipping record from the given files.
   * The function runs within a transaction and returns the created record.
   * If the shipping record with the given id already exists, it will be updated instead.
   * @param files - The files to generate the shipping record from.
   * @param _id - The optional id of the shipping record to update.
   * @param session - The optional client session to use for the transaction.
   * @returns The created shipping record document.
   */
  async generateShippingFromFiles(
    files: Express.Multer.File[],
    _id: string | undefined,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    const userId = userStorage.getStore()?.user?._id;

    return await runTransaction<ShippingDocument>(
      session,
      async (newSession) => {
        const bucket = this.connectionManager.bindBucketToDb();

        // Get countries
        const countries = await this.countryService.get(
          {},
          undefined,
          undefined,
          undefined,
          newSession
        );

        // Generate
        const parts = files.map((file) =>
          this.genAIService.fileToGenerativePart(file)
        );

        const response = await this.genAIService.generate({
          question: this.GENAI_GENERATE_SHIPPING_MESSAGE,
          context: `${this.GENAI_CONTEXT} ${JSON.stringify({
            countries,
          })}`,
          promptParts: parts,
          schema: shippingGenAISchema,
        });

        // Parse
        const shippingData = JSON.parse(response.text || "") as ShippingDTO;

        // Save pdf files to gridFS
        const gridFSFiles = await Promise.all(
          files.map(async (file) => await bucket.uploadFile(file))
        );

        // Attach file to shipping
        shippingData.invoices?.forEach(
          (invoice, i) =>
            (invoice.pdf.file = {
              fileId: gridFSFiles[i],
              name: files[i].originalname,
              mimeType: files[i].mimetype,
              size: files[i].size,
            })
        );

        if (_id) {
          if (!(await this.getById(_id, newSession)))
            throw new ValidationException("Shipping does not exist");

          return await super.update(
            {
              ...shippingData,
              _id: _id,
              updatedBy: userId,
            },
            newSession
          );
        } else {
          return await super.create(
            {
              ...shippingData,
              createdBy: userId,
            },
            newSession
          );
        }
      }
    );
  }

  /**
   * Generate HS codes for shipping using the GEN-AI service, then enrich each
   * AI-generated line with authoritative tariff and description data from the DB.
   * @param data The data to generate HS codes for
   * @returns A promise that resolves to an array of enriched line documents
   * @throws InternalServerException If the GEN-AI service fails
   */
  async generateHSCodesForShipping(
    data: HScodeDTO
  ): Promise<ShippingInvoicePdfExtractedDatumLine[]> {
    try {
      const response = await this.genAIService.generate({
        question: this.GENAI_GENERATE_HS_CODE_MESSAGE,
        context: `${this.GENAI_CONTEXT} ${JSON.stringify({
          lines: data.lines,
        })}`,
        schema: linesGenAISchema,
      });

      // Parse as lean plain-object types — no Mongoose document machinery needed here
      const linesData = JSON.parse(
        response.text || ""
      ) as ShippingInvoicePdfExtractedDatumLine[];

      // Enrich each line with authoritative DB data using the HS code
      await Promise.all(
        linesData.map(async (line) => {
          const hsCode = line.hsCode;
          if (!hsCode || hsCode.length < 7) return;

          // Parse 7-digit HS code into chapter / heading / subheading
          const chapter = hsCode.slice(0, 2);
          const heading = hsCode.slice(2, 4);
          const subheading = hsCode.slice(4, 7);

          const [dbTariff] = await Promise.all([
            this.customsTariffService.lookupByParts(
              chapter,
              heading,
              subheading
            ),
            this.enrichLineDescriptions(line, chapter, heading),
          ]);

          if (dbTariff) {
            this.applyDbTariffToLine(line, dbTariff);
          }
        })
      );

      return linesData;
    } catch (error) {
      throw new InternalServerException(
        "Error generating HS codes for shipping"
      );
    }
  }

  /**
   * Generate tariff for shipping using the GEN-AI service, then enrich each
   * AI-generated line with authoritative tariff and description data from the DB.
   * @param data The data to generate tariff for
   * @returns A promise that resolves to an array of enriched line documents
   * @throws InternalServerException If the GEN-AI service fails
   */
  async generateTariffForShipping(
    data: HScodeDTO
  ): Promise<ShippingInvoicePdfExtractedDatumLine[]> {
    try {
      const response = await this.genAIService.generate({
        question: this.GENAI_GENERATE_TARIFF_MESSAGE,
        context: `${this.GENAI_CONTEXT} ${JSON.stringify({
          lines: data.lines,
        })}`,
        schema: linesGenAISchema,
      });

      // Parse as lean plain-object types — no Mongoose document machinery needed here
      const linesData = JSON.parse(
        response.text || ""
      ) as ShippingInvoicePdfExtractedDatumLine[];

      // Enrich each line with authoritative DB tariff data
      await Promise.all(
        linesData.map(async (line) => {
          const tariff = line.tariff;
          if (!tariff) return;

          let dbTariff: CustomsTariffDocument | null = null;

          // First try exact lookup by tariff.code
          if (tariff.code) {
            dbTariff = await this.customsTariffService.lookupByCode(
              tariff.code
            );
          }

          // Fallback: lookup by chapter/heading/subheading
          if (
            !dbTariff &&
            tariff.chapter &&
            tariff.heading &&
            tariff.subheading
          ) {
            dbTariff = await this.customsTariffService.lookupByParts(
              tariff.chapter,
              tariff.heading,
              tariff.subheading
            );
          }

          if (dbTariff) {
            this.applyDbTariffToLine(line, dbTariff);
            await this.enrichLineDescriptions(
              line,
              dbTariff.chapter,
              dbTariff.heading
            );
          }
        })
      );

      return linesData;
    } catch (error) {
      throw new InternalServerException("Error generating tariff for shipping");
    }
  }
}
