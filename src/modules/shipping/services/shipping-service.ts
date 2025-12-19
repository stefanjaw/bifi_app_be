import { ShippingDocument } from "@mongodb-types";
import { BaseService, runTransaction, UserStore } from "../../../system";
import { shippingModel } from "../models/shipping.model";
import { ClientSession } from "mongoose";
import { ShippingDTO, UpdateShippingDTO } from "../models/shipping.dto";
import { GenAIService } from "../../genai/services/genai-service";
import { CountryService } from "../../countries/services/country-service";
import { CompanyService } from "../../companies/services/company-service";
import { shippingSchema } from "../models/shipping.schema";

export class ShippingService extends BaseService<ShippingDocument> {
  // constants
  private readonly GENAI_CONTEXT = ` 
      You are a financial advisor with an expertise in understanding invoices and shippings.
      You will receive a single input document as an invoice and shipping &
      you will have to answer questions based on the input document.
  `;

  private readonly GENAI_MESSAGE = ` 
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

  // services
  private readonly genAIService = new GenAIService();
  private readonly countryService = new CountryService();
  private readonly companyService = new CompanyService();

  constructor() {
    super({
      model: shippingModel,
    });
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

  async generateShippingFromFile(
    file: Express.Multer.File,
    session?: ClientSession | undefined
  ): Promise<ShippingDocument> {
    return await runTransaction<ShippingDocument>(
      session,
      async (newSession) => {
        const parts = [this.genAIService.fileToGenerativePart(file)];

        const response = await this.genAIService.generate({
          question: this.GENAI_MESSAGE,
          context: this.GENAI_CONTEXT,
          promptParts: parts,
          schema: shippingSchema,
        });

        const shippingData = JSON.parse(response.text || "") as ShippingDTO;

        return await super.create(
          {
            ...shippingData,
            createdBy: UserStore.getInstance().user?.id,
          },
          newSession
        );
      }
    );
  }
}
