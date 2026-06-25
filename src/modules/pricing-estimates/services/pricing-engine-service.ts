import { AiSettingsService } from "../../ai-settings/services/ai-settings-service";
import { GemsService } from "../../ai/gems/services/gems-service";
import { PricingSearchService } from "../../pricing-index/services/pricing-search-service";
import { PricingSettingsService } from "./pricing-settings-service";
import { ConnectionManager } from "../../../system/libraries/base-module/connection-manager";
import { catalogCacheModel } from "../../pricing-index/models/catalog-cache.model";
import { freightCacheModel } from "../../pricing-index/models/freight-cache.model";
import { ValidationException } from "../../../system";
import { Schema, Type } from "@google/genai";

interface ParsedProduct {
  product: string;
  supplier?: string;
  partNo?: string;
  qty: number;
}

interface EstimateLineItem {
  product: string;
  supplier: string;
  partNo: string;
  qty: number;
  unitPrice: number;
  freightPerUnit: number;
  hsCode: string;
  dutyPct: number;
  dutyPerUnit: number;
  wharfage: number;
  landedPerUnit: number;
  custPricePerUnit: number;
  marginPct: number;
  totalCust: number;
}

interface EstimateResult {
  lineItems: EstimateLineItem[];
  totalLanded: number;
  totalCustomer: number;
  wharfageBankFeePct: number;
  wharfageBankFeeAmount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  aiModel: string;
}

interface TokenEstimation {
  catalogRowsToRetrieve: number;
  freightRowsToRetrieve: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  totalEstimated: number;
  withinLimits: boolean;
}

const PRODUCT_PARSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      product: { type: Type.STRING },
      supplier: { type: Type.STRING },
      partNo: { type: Type.STRING },
      qty: { type: Type.NUMBER },
    },
    required: ["product", "qty"],
  },
};

const TOKENS_PER_ROW = 50;
const OUTPUT_TOKENS_PER_PRODUCT = 200;

export class PricingEngineService {
  private aiSettingsService = new AiSettingsService();
  private searchService = new PricingSearchService();
  private pricingSettingsService = new PricingSettingsService();
  private connectionManager = new ConnectionManager();

  async calculateEstimate(params: {
    requestText: string;
    shippingMethod?: string;
    pricingControls?: {
      dutyFree?: boolean;
      method?: string;
      markupFactor?: number;
      margin?: number;
    };
    specialInstructions?: string;
  }): Promise<EstimateResult> {
    const aiSettings = await this.aiSettingsService.getSettings();
    if (!aiSettings || !aiSettings.apiKey) {
      throw new ValidationException(
        "AI settings not configured. Please add an API key."
      );
    }

    const pricingSettings = await this.pricingSettingsService.getSettings();
    const wharfagePct = pricingSettings?.defaultWharfageBankFeePct ?? 2;

    const controls = {
      dutyFree: params.pricingControls?.dutyFree ?? false,
      method:
        params.pricingControls?.method ??
        pricingSettings?.defaultPricingMethod ??
        "markup",
      markupFactor:
        params.pricingControls?.markupFactor ??
        pricingSettings?.defaultMarkupFactor ??
        1.3,
      margin:
        params.pricingControls?.margin ?? pricingSettings?.defaultMargin ?? 30,
    };

    const gemsService = new GemsService({
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      embeddingModel: aiSettings.embeddingModel,
    });

    const parsePrompt = `Extract all product requests from the following text. For each product, extract the product name/description, supplier/vendor if mentioned, part number if mentioned, and quantity. If quantity is not specified, assume 1.\n\nRequest:\n${
      params.requestText
    }${
      params.specialInstructions
        ? `\n\nSpecial Instructions:\n${params.specialInstructions}`
        : ""
    }`;

    const parseResponse = await gemsService.generate({
      question: parsePrompt,
      schema: PRODUCT_PARSE_SCHEMA,
    });

    let inputTokens = parseResponse.usageMetadata?.promptTokenCount ?? 0;
    let outputTokens = parseResponse.usageMetadata?.candidatesTokenCount ?? 0;

    let products: ParsedProduct[] = [];
    try {
      const parsed = JSON.parse(parseResponse.text ?? "[]");
      products = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      products = [
        {
          product: params.requestText.substring(0, 100),
          qty: 1,
        },
      ];
    }

    const lineItems: EstimateLineItem[] = [];
    let totalLanded = 0;
    let totalCustomer = 0;
    let totalWharfage = 0;

    for (const product of products) {
      const catalogResults = await this.searchService.searchCatalog(
        `${product.supplier ?? ""} ${product.product} ${
          product.partNo ?? ""
        }`.trim(),
        5
      );

      const freightResults = await this.searchService.searchFreight(
        `${params.shippingMethod ?? "sea"} ${product.product}`.trim(),
        3
      );

      const unitPrice =
        catalogResults.length > 0 ? catalogResults[0].unit_price ?? 0 : 0;

      const supplier =
        product.supplier ??
        (catalogResults.length > 0 ? catalogResults[0].supplier ?? "" : "");

      const freightPerUnit =
        freightResults.length > 0 ? freightResults[0].rate_usd ?? 0 : 0;

      const dutyPct = 0;
      const hsCode = "";
      const dutyPerUnit = controls.dutyFree ? 0 : unitPrice * (dutyPct / 100);

      const landedPerUnit = unitPrice + freightPerUnit + dutyPerUnit;

      const wharfagePerUnit = landedPerUnit * (wharfagePct / 100);
      const landedWithWharfage = landedPerUnit + wharfagePerUnit;

      let custPricePerUnit: number;
      let marginPct: number;

      if (controls.method === "markup") {
        custPricePerUnit = landedWithWharfage * controls.markupFactor;
        marginPct =
          custPricePerUnit > 0
            ? ((custPricePerUnit - landedWithWharfage) / custPricePerUnit) * 100
            : 0;
      } else {
        custPricePerUnit = landedWithWharfage / (1 - controls.margin / 100);
        marginPct = controls.margin;
      }

      const totalCustLine = custPricePerUnit * product.qty;

      const lineItem: EstimateLineItem = {
        product: product.product,
        supplier,
        partNo: product.partNo ?? "",
        qty: product.qty,
        unitPrice: Math.round(unitPrice * 100) / 100,
        freightPerUnit: Math.round(freightPerUnit * 100) / 100,
        hsCode,
        dutyPct: Math.round(dutyPct * 100) / 100,
        dutyPerUnit: Math.round(dutyPerUnit * 100) / 100,
        wharfage: Math.round(wharfagePerUnit * 100) / 100,
        landedPerUnit: Math.round(landedWithWharfage * 100) / 100,
        custPricePerUnit: Math.round(custPricePerUnit * 100) / 100,
        marginPct: Math.round(marginPct * 100) / 100,
        totalCust: Math.round(totalCustLine * 100) / 100,
      };

      lineItems.push(lineItem);
      totalLanded += landedWithWharfage * product.qty;
      totalCustomer += totalCustLine;
      totalWharfage += wharfagePerUnit * product.qty;
    }

    const wharfageBankFeeAmount = totalWharfage;

    const costPerInputToken = 0.000001;
    const costPerOutputToken = 0.000002;
    const totalTokens = inputTokens + outputTokens;
    const estimatedCost =
      inputTokens * costPerInputToken + outputTokens * costPerOutputToken;

    return {
      lineItems,
      totalLanded: Math.round(totalLanded * 100) / 100,
      totalCustomer: Math.round(totalCustomer * 100) / 100,
      wharfageBankFeePct: wharfagePct,
      wharfageBankFeeAmount: Math.round(wharfageBankFeeAmount * 100) / 100,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost: Math.round(estimatedCost * 10000) / 10000,
      aiModel: aiSettings.model ?? "gemini-2.5-flash",
    };
  }

  async tokenEstimate(requestText: string): Promise<TokenEstimation> {
    const aiSettings = await this.aiSettingsService.getSettings();
    const maxTokenLimit = aiSettings?.maxTokenLimit ?? 10000;

    const catalogModel =
      this.connectionManager.bindModelToDb(catalogCacheModel);
    const freightModel =
      this.connectionManager.bindModelToDb(freightCacheModel);

    const words = requestText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let catalogRowsToRetrieve = 0;
    let freightRowsToRetrieve = 0;

    if (words.length > 0) {
      const orConditions = words.map((w) => ({
        product_name: {
          $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      }));

      catalogRowsToRetrieve = await catalogModel.countDocuments({
        active: true,
        $or: orConditions,
      });

      const freightOrConditions = words.map((w) => ({
        carrier: {
          $regex: w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      }));

      freightRowsToRetrieve = await freightModel.countDocuments({
        active: true,
        $or: freightOrConditions,
      });
    }

    const catalogRows = Math.min(catalogRowsToRetrieve, 50);
    const freightRows = Math.min(freightRowsToRetrieve, 20);

    const promptBaseTokens = Math.ceil(requestText.length / 4) + 200;
    const contextTokens = (catalogRows + freightRows) * TOKENS_PER_ROW;
    const estimatedInputTokens = promptBaseTokens + contextTokens;

    const productCount = Math.max(
      1,
      words.filter((w) =>
        ["need", "want", "order", "buy", "quote", "price", "get"].includes(w)
      ).length || Math.ceil(words.length / 5)
    );
    const estimatedOutputTokens = productCount * OUTPUT_TOKENS_PER_PRODUCT;

    const totalEstimated = estimatedInputTokens + estimatedOutputTokens;
    const withinLimits = totalEstimated <= maxTokenLimit;

    return {
      catalogRowsToRetrieve: catalogRows,
      freightRowsToRetrieve: freightRows,
      estimatedInputTokens,
      estimatedOutputTokens,
      totalEstimated,
      withinLimits,
    };
  }
}
