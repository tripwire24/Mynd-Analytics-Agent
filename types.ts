export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  data: ChartDataPoint[];
  xAxisKey: string;
  dataKeys: string[];
  colors?: string[];
}

export type MessageRole = 'user' | 'model' | 'system';

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: any; // To store the result after execution
  isChart?: boolean; // Flag to indicate if this tool call resulted in a chart render
  chartConfig?: ChartConfig;
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}
