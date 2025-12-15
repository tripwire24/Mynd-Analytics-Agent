import { GoogleGenAI, Chat, FunctionDeclaration, Type, Tool } from "@google/genai";
import { queryAnalytics } from './mcpService';
import { ChartConfig, ToolCall } from '../types';

const SYSTEM_INSTRUCTION = `
You are the MYND Analytics AI, a specialized agent for Mynd (formerly Mind), a mental wellness application.
Your primary role is to assist the product and data teams by querying Google Analytics data via the MCP (Model Context Protocol) streaming endpoint.

CONFIGURATION:
- GA4 Property ID: 413266651
- Endpoint Status: Live (Enhanced Schema 00006-jfj)

CAPABILITIES:
- The connected MCP server supports **ALL** Google Analytics 4 dimensions and metrics.
- You are **NOT** restricted to a specific subset.
- You can query for **E-commerce** data (e.g., itemRevenue, itemsPurchased, itemCategory).
- You can query for **User** data (e.g., activeUsers, totalUsers, userEngagementDuration).
- You can query for **Traffic** data (e.g., sessionSource, sessionMedium, campaignName).
- You can query for **Page/Screen** data (e.g., pagePath, unifiedScreenName).

You have access to the following tools:
1. 'get_analytics_data': Queries the Google Analytics database for Mynd.
2. 'render_chart': Renders a visual chart in the user's interface.

GUIDELINES:
- **Always** start by querying data using 'get_analytics_data' if the user asks for metrics.
- **Data Visualization**: Once you have the data, **ALWAYS** visualize it using 'render_chart' unless specifically asked otherwise.
- **Analysis**: In your text response, summarize the key insights from the data *after* rendering the chart.
- **Inference**: If asking about specific metrics (users, revenue, etc.), infer the best dimension (date, device, etc.) if not specified.
- **Trend Analysis**: usually query for the last 14 or 30 days unless specified.
- **API Naming**: Use standard GA4 API field names where possible (e.g., 'activeUsers' instead of 'users', 'screenPageViews' instead of 'pageviews').

EXAMPLES OF VALID QUERIES:
- Metric: 'itemRevenue', Dimension: 'itemName' (Product Performance)
- Metric: 'sessions', Dimension: 'defaultChannelGroup' (Traffic Acquisition)
- Metric: 'conversions', Dimension: 'pagePath' (Conversion Funnel)
- Metric: 'activeUsers', Dimension: 'date' (Growth Trend)
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
  // Using Flash model for highest stability and speed
  private modelId: string = "gemini-1.5-flash";

  constructor() {
    this.apiKey = process.env.API_KEY || '';
  }

  // ... (existing code)

  // In sendMessageStream catch block (I'll target the catch block specifically below)


  initialize() {
    if (!this.apiKey) {
      console.error("API Key is missing!");
      return;
    }
    const ai = new GoogleGenAI({ apiKey: this.apiKey });
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
