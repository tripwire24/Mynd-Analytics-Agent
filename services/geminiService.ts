import { GoogleGenAI, Chat, FunctionDeclaration, Type, Tool } from "@google/genai";
import { queryAnalytics } from './mcpService';
import { ChartConfig, ToolCall } from '../types';

const SYSTEM_INSTRUCTION = `
You are the Mynd Analytics Agent, an expert in Google Analytics 4 (GA4) data analysis.
Your goal is to provide clear, actionable insights by querying the GA4 MCP server and presenting data in a clean, professional format.

### 1. Tool Functions & Usage
- **runReport**: Main tool for fetching data. Requires 'startDate', 'endDate', 'metrics' (non-empty array), and usually 'dimensions'.
- **runRealtimeReport**: For current/live data (last 30 min). Requires 'metrics'.
- **getMetadata**: Call this FIRST if you are unsure about custom metric/dimension names. Cache these concept names for the session.
- **listPropertyAliases**: Fallback ONLY. Use only if a property ID is invalid or user explicitly asks to list properties.

### 2. Date Handling
- "August 2025" -> 2025-08-01 to 2025-08-31
- "last 7 days" -> Convert to specific dates (e.g., if today is 2023-11-08, use 2023-11-01 to 2023-11-07).
- Never invent data. If you have 0 rows, check factual fallbacks (sessions -> purchases -> item sales).

### 3. Workflow & Guardrails
- **Exact Names**: ALWAYS use exact GA4 API field names (e.g., 'activeUsers', 'totalRevenue'). Do not guess synonyms. If ambiguous, ask the user (e.g., "activeUsers or totalUsers?").
- **Zero Rows**: If a report returns empty, say "No sessions found" or "No sales found" directly. Do not hallucinate data.
- **Privacy**: Do not show raw property IDs in the final output footer unless necessary.

### 4. Output Formatting (CRITICAL - MARKDOWN)
- **Structure**: Use Markdown headers (###) for sections.
- **Tables**: Use Markdown tables for data comparisons. They are much easier to read.
  | Item | Revenue | Sales |
  |------|---------|-------|
  | A    | $500.00 | 10    |
- **Lists**: Use bullet points for insights.
- **Numbers**: Use thousands separators (1,234) and currency formatting ($1,234.56). Percentages 1 decimal place.
- **Footer**: Always end with a small contact context line: *Data source: GA4 | Date range: [Start] to [End]*

### 5. Interaction Style
- Be concise. 1-2 sentences of commentary, then the data.
- If the user asks for a chart, call 'render_chart' with the data you have fetched.
- **Charts**: If you render a chart, *briefly* mention it in text, do not describe every bar.
`;

const getAnalyticsTool: FunctionDeclaration = {
  name: 'get_analytics_data',
  description: 'Query Google Analytics data. Supports ALL standard GA4 metrics and dimensions.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      metric: {
        type: Type.STRING,
        description: 'The GA4 metric to retrieve (e.g., activeUsers, itemRevenue, sessions, bounceRate).',
      },
      dimension: {
        type: Type.STRING,
        description: 'The GA4 dimension to group by (e.g., date, source, pagePath, itemName, deviceCategory).',
      },
      days: {
        type: Type.NUMBER,
        description: 'Number of days to look back (default 7).',
      },
    },
    required: ['metric', 'dimension'],
  },
};

const renderChartTool: FunctionDeclaration = {
  name: 'render_chart',
  description: 'Render a chart in the user interface based on data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        description: 'Chart type: line, bar, area, pie.',
      },
      title: {
        type: Type.STRING,
        description: 'Title of the chart.',
      },
      xAxisKey: {
        type: Type.STRING,
        description: 'Key to use for the X-axis (e.g., name, date).',
      },
      dataKeys: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Keys to use for the data series.',
      },
      data: {
        type: Type.ARRAY,
        items: { type: Type.OBJECT },
        description: 'Array of data objects.',
      },
    },
    required: ['type', 'title', 'data', 'xAxisKey', 'dataKeys'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [getAnalyticsTool, renderChartTool] }];

export class GeminiService {
  private chat: Chat | null = null;
  private apiKey: string;
  // User requested "Gemini 3 Pro" - verified in docs as valid preview model
  private modelId: string = "gemini-3-pro-preview";

  constructor() {
    this.apiKey = process.env.API_KEY || '';
  }

  async listAvailableModels(ai: GoogleGenAI) {
    try {
      // This is a debug step to see what models the key actually has access to
      // accessible via browser console
      console.log("Checking available models...");
      // Note: The specific listing method depends on the SDK version, 
      // strictly logging for now to allow connection attempt.
    } catch (e) {
      console.error("Failed to list models", e);
    }
  }

  initialize() {
    if (!this.apiKey) {
      console.error("API Key is missing!");
      return;
    }
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
    this.listAvailableModels(ai);

    // Log intent
    console.log(`Initializing Chat with Model: ${this.modelId}`);

    this.chat = ai.chats.create({
      model: this.modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
      },
    });
  }

  async sendMessageStream(
    message: string,
    onChunk: (text: string) => void,
    onToolCall: (call: ToolCall) => void
  ) {
    if (!this.chat) this.initialize();
    if (!this.chat) throw new Error("Failed to initialize chat");

    // Send initial message
    const responseStream = await this.chat.sendMessageStream({ message });
    await this.handleStream(responseStream, onChunk, onToolCall);
  }

  private async handleStream(
    stream: any,
    onChunk: (text: string) => void,
    onToolCall: (call: ToolCall) => void
  ) {
    const functionCalls: any[] = [];

    // 1. Consume the stream fully. 
    // This ensures the SDK knows the current turn is finished receiving.
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
      if (chunk.functionCalls) {
        functionCalls.push(...chunk.functionCalls);
      }
    }

    // 2. Process function calls if any exist
    if (functionCalls.length > 0) {
      const functionResponseParts = [];

      // Execute all tools
      for (const fc of functionCalls) {
        const callId = fc.id || `call-${Math.random().toString(36).substr(2, 9)}`;
        const args = fc.args as any;
        const name = fc.name;

        // Notify UI of the tool call intention
        onToolCall({ id: callId, name, args, isChart: name === 'render_chart' });

        // Execute Tool logic
        let toolResult: any = { result: "ok" };
        try {
          if (name === 'get_analytics_data') {
            console.log(`[MCP] Connecting to Google Analytics stream for: ${args.metric}...`);
            toolResult = await queryAnalytics(args.metric, args.dimension, args.days || 7);
          } else if (name === 'render_chart') {
            console.log(`[UI] Rendering chart: ${args.title}`);
            // UI rendering is handled via onToolCall, we just confirm success to the model
            toolResult = { status: "chart_rendered_successfully" };
          }
        } catch (error) {
          console.error("Tool Execution Error", error);
          toolResult = { error: "Failed to execute tool" };
        }

        // Prepare the response part
        functionResponseParts.push({
          functionResponse: {
            id: fc.id, // Must match the ID from the model
            name: fc.name,
            response: { result: toolResult }
          }
        });
      }

      // 3. Send the tool responses back to the model as the next message
      // This is legal because the previous stream loop has finished.
      const nextStream = await this.chat.sendMessageStream({
        message: functionResponseParts
      });

      // 4. Recursively handle the new stream (which might contain the model's text summary or more tool calls)
      await this.handleStream(nextStream, onChunk, onToolCall);
    }
  }
}

export const geminiService = new GeminiService();
