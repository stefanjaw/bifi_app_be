import { GoogleGenAI, Part, Schema } from "@google/genai";
import { ValidationException } from "../../../../system";

export class GenAIService {
  private readonly MODEL = "gemini-2.5-flash";

  // gen instance
  private genAI = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
  });

  /**
   * Generates content using the given question, context, and prompt parts.
   * Throws a ValidationException if there is an error.
   *
   * @param {string} question the question to generate content for
   * @param {string} [context] the context to generate content in
   * @param {Part[]} [promptParts] the parts to generate content for
   * @param {Schema} [schema] the schema to generate content in
   * @returns a promise resolving to the generated content
   */
  generate({
    question,
    context = "",
    promptParts = [],
    schema,
  }: {
    question: string;
    context?: string;
    promptParts?: Part[];
    schema?: Schema;
  }) {
    try {
        console.log("GOOGLE_GENAI_API_KEY", process.env.GOOGLE_GENAI_API_KEY);

      return this.genAI.models.generateContent({
        model: this.MODEL,
        contents: [question, context, ...promptParts],
        config: {
          ...(schema && {
            responseSchema: schema,
            responseMimeType: "application/json",
          }),
        },
      });
    } catch (error: any) {
      throw new ValidationException(error.message);
    }
  }

  /**
   * Generate content using genAI model as a stream
   * @param {string} question the question to generate content for
   * @param {string} [context] the context to generate content in
   * @param {Part[]} [promptParts] the parts to generate content for
   * @param {Schema} [schema] the schema to generate content in
   * @returns a readable stream of generated content
   */
  generateStream({
    question,
    context = "",
    promptParts = [],
    schema,
    signal,
  }: {
    question: string;
    context?: string;
    promptParts?: Part[];
    schema?: Schema;
    signal?: AbortSignal;
  }) {
    return this.genAI.models.generateContentStream({
      model: this.MODEL,
      contents: [question, context, ...promptParts],
      config: {
        ...(schema && { responseSchema: schema }),
        abortSignal: signal,
      },
    });
  }

  /**
   * Converts an Express.Multer.File to a GenAI Part.
   * @param file the file to convert
   * @returns a GenAI Part with the file's contents as inline data
   */
  fileToGenerativePart(file: Express.Multer.File): Part {
    return {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString("base64"),
      },
    };
  }

  /**
   * Converts a Buffer to a GenAI Part.
   * @param buffer the Buffer to convert
   * @returns a GenAI Part with the Buffer's contents as inline data
   */
  bufferToGenerativePart(buffer: Buffer): Part {
    return {
      inlineData: {
        mimeType: "application/octet-stream",
        data: buffer.toString("base64"),
      },
    };
  }

  /**
   * Converts a string to a GenAI Part.
   * @param text the string to convert
   * @returns a GenAI Part with the string's contents as inline data
   */
  stringToGenerativePart(text: string): Part {
    return {
      inlineData: {
        mimeType: "text/plain",
        data: text,
      },
    };
  }
}
