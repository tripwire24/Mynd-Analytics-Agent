const MCP_ENDPOINT = "https://ga4-mcp-server-ciyqx2rz4q-uc.a.run.app/tools/run_report";
const PROPERTY_ID = "413266651";

// Helper to format date relative to today
const getDateRange = (days: number) => {
    return {
        start_date: `${days}daysAgo`,
        end_date: 'today'
    };
};

export const queryAnalytics = async (
    metric: string,
    dimension: string,
    days: number = 7
): Promise<any[]> => {
    console.log(`[MCP] Querying GA4 Property ${PROPERTY_ID} via ${MCP_ENDPOINT}`);
    console.log(`[MCP] Request: Metric=${metric}, Dimension=${dimension}, Range=${days}d`);

    try {
        const response = await fetch(MCP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                property_id: PROPERTY_ID,
                date_ranges: [getDateRange(days)],
                metrics: [metric],
                dimensions: [dimension]
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[MCP] API Error (${response.status}):`, errorText);
            throw new Error(`MCP Server Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // The server returns structured data: { property_id, date_range, dimensions, metrics, row_count, data: [...] }
        // The app expects an array of row objects
        if (result && Array.isArray(result.data)) {
            console.log(`[MCP] Received ${result.data.length} rows of live data`);
            return result.data;
        } else {
            console.warn("[MCP] Received unexpected data format:", result);
            return [];
        }

    } catch (error) {
        console.error("[MCP] Connection Failed:", error);
        // CRITICAL: Do NOT return fake data on error. Return empty or throw 
        // to let the user know something is actually wrong.
        throw error;
    }
};
