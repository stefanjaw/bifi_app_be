import { GoogleGenAI, Part, Schema } from "@google/genai";
import { ValidationException } from "../../../../system";

export interface GemsServiceConfig {
  apiKey: string;
  model?: string;
  embeddingModel?: string;
}

export class GemsService {
  private genAI: GoogleGenAI;
  private model: string;
  private embeddingModel: string;

  constructor(config: GemsServiceConfig) {
    this.model = config.model || "gemini-2.5-flash";
    this.embeddingModel = config.embeddingModel || "text-embedding-004";
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
  }

  generate({
    question,
    context = "",
    promptParts = [],
    schema,
    maxOutputTokens,
  }: {
    question: string;
    context?: string;
    promptParts?: Part[];
    schema?: Schema;
    maxOutputTokens?: number;
  }) {
    try {
      return this.genAI.models.generateContent({
        model: this.model,
        contents: [question, context, ...promptParts],
        config: {
          ...(schema && {
            responseSchema: schema,
            responseMimeType: "application/json",
          }),
          ...(maxOutputTokens && { maxOutputTokens }),
        },
      });
    } catch (error: any) {
      throw new ValidationException(error.message);
    }
  }

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
      model: this.model,
      contents: [question, context, ...promptParts],
      config: {
        ...(schema && { responseSchema: schema }),
        abortSignal: signal,
      },
    });
  }

  async generateEmbedding({ text }: { text: string }) {
    try {
      const result = await this.genAI.models.embedContent({
        model: this.embeddingModel,
        contents: text,
      });
      return result;
    } catch (error: any) {
      throw new ValidationException(error.message);
    }
  }

  async generateEmbeddings({ texts }: { texts: string[] }) {
    try {
      const results = await Promise.all(
        texts.map((text) =>
          this.genAI.models.embedContent({
            model: this.embeddingModel,
            contents: text,
          })
        )
      );
      return results;
    } catch (error: any) {
      throw new ValidationException(error.message);
    }
  }

  fileToGenerativePart(file: Express.Multer.File): Part {
    return {
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString("base64"),
      },
    };
  }

  bufferToGenerativePart(buffer: Buffer): Part {
    return {
      inlineData: {
        mimeType: "application/octet-stream",
        data: buffer.toString("base64"),
      },
    };
  }

  stringToGenerativePart(text: string): Part {
    return {
      inlineData: {
        mimeType: "text/plain",
        data: text,
      },
    };
  }
}
