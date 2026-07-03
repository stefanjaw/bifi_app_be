import { NextFunction, Request, Response } from "express";
import { GenAIService } from "../services/genai-service";
import { FileValidatorService } from "../../../../system";
import { Part } from "@google/genai";

export class GenAIController {
  private genAIService = new GenAIService();
  private fileValidator = new FileValidatorService();

  protected async generateHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const body = { ...req.body };
      const files = req.files as Express.Multer.File[];
      const parts: Part[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          this.fileValidator.validateMaxSize(file);
          const part = await this.genAIService.fileToGenerativePart(file);
          parts.push(part);
        }
      }

      const response = await this.genAIService.generate({
        question: body.question,
        context: body.context,
        // schema: body.schema,
        promptParts: parts,
      });

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  async generateStreamHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const body = { ...req.body };
      const files = req.files as Express.Multer.File[];
      const parts: Part[] = [];

      if (files && files.length > 0) {
        for (const file of files) {
          this.fileValidator.validateMaxSize(file);
          const part = this.genAIService.fileToGenerativePart(file);
          parts.push(part);
        }
      }

      // set headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      // signal aborting
      const signal = new AbortController();

      res.on("close", () => {
        signal.abort();
      });

      // stream
      const stream = await this.genAIService.generateStream({
        question: body.question,
        context: body.context,
        // schema: body.schema,
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

  generate = async (req: Request, res: Response, next: NextFunction) => {
    await this.generateHandler(req, res, next);
  };

  generateStream = async (req: Request, res: Response, next: NextFunction) => {
    await this.generateStreamHandler(req, res, next);
  };
}
