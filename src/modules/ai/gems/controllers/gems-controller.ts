import { NextFunction, Request, Response } from "express";
import { GemsService } from "../services/gems-service";
import { AiSettingsService } from "../../../ai-settings/services/ai-settings-service";
import { FileValidatorService, ValidationException } from "../../../../system";
import { Part } from "@google/genai";

export class GemsController {
  private aiSettingsService = new AiSettingsService();
  private fileValidator = new FileValidatorService();

  private async resolveGemsService(): Promise<GemsService> {
    const settings = await this.aiSettingsService.getSettings();
    if (!settings?.apiKey) {
      throw new ValidationException(
        "AI settings are not configured. Please set up the API key in Pricing AI Settings.",
      );
    }
    return new GemsService({
      apiKey: settings.apiKey,
      model: settings.model || undefined,
      embeddingModel: settings.embeddingModel || undefined,
    });
  }

  protected async generateHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const gemsService = await this.resolveGemsService();
      const body = { ...req.body };
      const files = req.files as Express.Multer.File[];
      const parts: Part[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          this.fileValidator.validateMaxSize(file);
          const part = await gemsService.fileToGenerativePart(file);
          parts.push(part);
        }
      }

      const response = await gemsService.generate({
        question: body.question,
        context: body.context,
        promptParts: parts,
      });

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  async generateStreamHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const gemsService = await this.resolveGemsService();
      const body = { ...req.body };
      const files = req.files as Express.Multer.File[];
      const parts: Part[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          this.fileValidator.validateMaxSize(file);
          const part = gemsService.fileToGenerativePart(file);
          parts.push(part);
        }
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const signal = new AbortController();

      res.on("close", () => {
        signal.abort();
      });

      const stream = await gemsService.generateStream({
        question: body.question,
        context: body.context,
        promptParts: parts,
        signal: signal.signal,
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        res.write(`data: ${text}\n\n`);
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      next(error);
    }
  }

  protected async embedHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const gemsService = await this.resolveGemsService();
      const body = { ...req.body };

      if (body.texts && Array.isArray(body.texts)) {
        const response = await gemsService.generateEmbeddings({
          texts: body.texts,
        });
        res.status(200).json(response);
      } else if (body.text) {
        const response = await gemsService.generateEmbedding({
          text: body.text,
        });
        res.status(200).json(response);
      } else {
        res.status(400).json({ message: "text or texts is required" });
      }
    } catch (error: any) {
      next(error);
    }
  }

  generate = async (req: Request, res: Response, next: NextFunction) => {
    await this.generateHandler(req, res, next);
  };

  generateStream = async (req: Request, res: Response, next: NextFunction) => {
    await this.generateStreamHandler(req, res, next);
  };

  embed = async (req: Request, res: Response, next: NextFunction) => {
    await this.embedHandler(req, res, next);
  };
}
