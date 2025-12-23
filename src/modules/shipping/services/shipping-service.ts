import { ShippingDocument } from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  runTransaction,
  UserStore,
  ValidationException,
} from "../../../system";
import { shippingModel } from "../models/shipping.model";
import { ClientSession } from "mongoose";
import { ShippingDTO, UpdateShippingDTO } from "../models/shipping.dto";
import { GenAIService } from "../../ia/genai/services/genai-service";
import { CountryService } from "../../countries/services/country-service";
import { shippingGenAISchema } from "../models/shipping.schema";

export class ShippingService extends BaseService<ShippingDocument> {
  // constants
  private readonly GENAI_CONTEXT = ` 
      You are a financial advisor with an expertise in understanding invoices and shippings.
      You will receive a single input document as an invoice and shipping &
      you will have to answer questions based on the input document.
  `;

  private readonly GENAI_GENERATE_SHIPPING_MESSAGE = ` 
      Your task is to extract structured data from the provided PDF document and return a single JSON object.

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
      - The invoice identifier (invoiceNumber or equivalent) MUST always be present and must be transcribed exactly as shown in the document.
      - Do not generate fake identifiers.

      Lines rules:
      - The lines array represents every charge, item, fee, or payment present in the document.
      - The lines array MUST NOT be empty.
      - Every line must include a customsClassification field.
      - customsClassification must be a short, concrete, human-readable product descriptor suitable for searching in an HS database.
        Examples: "Fresh apples", "Electric toaster", "Air fryer", "Live horses".
      - The description must be specific, not generic.

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
  `;

  private readonly GENAI_GENERATE_HS_CODE_MESSAGE = ` 
      You will receive an existing JSON object separately.
      That JSON MUST be treated as the source of truth.

      Your task is to UPDATE ONLY specific HS-related fields
      inside EACH line object and return the FULL JSON object.

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
      Only the following fields may be changed:

      - hsCode
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
  `;

  // services
  private readonly genAIService = new GenAIService();
  private readonly countryService = new CountryService();

  constructor() {
    super({
      model: shippingModel,
    });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
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
      { ...data, createdBy: UserStore.getInstance().user?.id },
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
      { ...data, updatedBy: UserStore.getInstance().user?.id },
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
    return await runTransaction<ShippingDocument>(
      session,
      async (newSession) => {
        const shipping = await super.getById(_id, newSession);

        return await super.create(
          {
            ...shipping?.toObject(),
            createdBy: UserStore.getInstance().user?.id,
          },
          newSession
        );
      }
    );
  }

  /**
   * Generates a shipping record from a file and saves it to the database.
   *
   * This function uses the Gen AI service to generate a shipping record from a file.
   * The generated shipping record is then parsed and saved to the database.
   *
   * The function runs a transactional operation.
   *
   * @param file - The file to generate the shipping record from.
   * @param _id - The id of the shipping record to update (if any).
   * @param session - Optional mongoose session.
   * @returns The generated shipping record.
   */
  async generateShippingFromFile(
    file: Express.Multer.File,
    _id: string | undefined,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    return await runTransaction<ShippingDocument>(
      session,
      async (newSession) => {
        // Get countries
        const countries = await this.countryService.get(
          {},
          undefined,
          undefined,
          undefined,
          newSession
        );

        // Generate
        const parts = [this.genAIService.fileToGenerativePart(file)];

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

        // Save pdf file to gridFS
        const gridFSFile = await this.gridFSBucket.uploadFile(file);

        // Attach file to shipping
        shippingData.invoices?.forEach(
          (invoice) =>
            (invoice.pdf.file = {
              fileId: gridFSFile,
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            })
        );

        if (_id) {
          if (!(await shippingModel.findById(_id).session(newSession)))
            throw new ValidationException("Shipping does not exist");

          return await super.update(
            {
              ...shippingData,
              _id: _id,
              updatedBy: UserStore.getInstance().user?.id,
            },
            newSession
          );
        } else {
          return await super.create(
            {
              ...shippingData,
              createdBy: UserStore.getInstance().user?.id,
            },
            newSession
          );
        }
      }
    );
  }

  /**
   * Generates HS codes for shipping record with the given id.
   *
   * The function runs within a transaction and returns the updated record.
   * @param _id - The id of the shipping record to update.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated record document.
   */
  async generateHSCodesForShipping(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    return await runTransaction<ShippingDocument>(
      session,
      async (newSession) => {
        const shipping = await super.getById(_id, newSession);

        // Check if shipping exists
        if (!shipping) throw new ValidationException("Shipping does not exist");

        // Generate
        const response = await this.genAIService.generate({
          question: this.GENAI_GENERATE_HS_CODE_MESSAGE,
          context: `${this.GENAI_CONTEXT} ${JSON.stringify({
            shipping,
          })}`,
          schema: shippingGenAISchema,
        });

        const shippingData = JSON.parse(response.text || "") as ShippingDTO;

        return await super.update(
          {
            ...shippingData,
            updatedBy: UserStore.getInstance().user?.id,
            _id: _id,
          },
          newSession
        );
      }
    );
  }
}
