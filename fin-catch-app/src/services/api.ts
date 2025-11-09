import axios, { AxiosInstance } from "axios";
import {
  StockHistoryRequest,
  StockHistoryResponse,
  GoldPriceRequest,
  GoldPriceResponse,
  DataRequest,
  DataResponse,
  SourceMetadata,
  HealthCheckResponse,
} from "../types";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const API_VERSION = "v1";

class FinCatchAPI {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: `${baseURL}/api/${API_VERSION}`,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        return config;
      },
      (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API Response] ${response.config.url}`, response.data);
        return response;
      },
      (error) => {
        console.error("[API Response Error]", error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch stock history data (POST method)
   */
  async fetchStockHistory(request: StockHistoryRequest): Promise<StockHistoryResponse> {
    try {
      const response = await this.client.post<StockHistoryResponse>("/stock/history", request);
      return response.data;
    } catch (error) {
      console.error("Error fetching stock history:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch gold price data (POST method)
   */
  async fetchGoldPrice(request: GoldPriceRequest): Promise<GoldPriceResponse> {
    try {
      const response = await this.client.post<GoldPriceResponse>("/gold/history", request);
      return response.data;
    } catch (error) {
      console.error("Error fetching gold price:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Fetch data using unified endpoint (POST method)
   */
  async fetchData(request: DataRequest): Promise<DataResponse> {
    try {
      const response = await this.client.post<DataResponse>("/data", request);
      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get list of available sources
   */
  async getSources(): Promise<SourceMetadata[]> {
    try {
      const response = await this.client.get<SourceMetadata[]>("/sources");
      return response.data;
    } catch (error) {
      console.error("Error fetching sources:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for all sources
   */
  async healthCheckAll(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get<HealthCheckResponse>("/health/sources");
      return response.data;
    } catch (error) {
      console.error("Error checking health:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check for a specific source
   */
  async healthCheckSource(sourceName: string): Promise<{ status: boolean }> {
    try {
      const response = await this.client.get<{ status: boolean }>(`/health/source/${sourceName}`);
      return response.data;
    } catch (error) {
      console.error(`Error checking health for ${sourceName}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.error || error.response.statusText;
        return new Error(`API Error (${error.response.status}): ${message}`);
      } else if (error.request) {
        // Request was made but no response
        return new Error("Network Error: Unable to reach the server. Please check if the API is running.");
      }
    }
    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

// Create and export a singleton instance
export const finCatchAPI = new FinCatchAPI();

// Export the class for testing purposes
export { FinCatchAPI };
