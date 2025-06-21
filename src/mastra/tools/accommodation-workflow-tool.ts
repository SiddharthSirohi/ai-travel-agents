import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { accommodationWorkflow, accommodationWorkflowOutputSchema } from '../workflows/accommodation-workflow';
import { waypointSchema } from '../../lib/pre-plan';

// Input schema for the accommodation workflow tool
const accommodationWorkflowToolInputSchema = z.object({
  city: z.string().describe('The city to search for accommodations'),
  waypoints: z.array(waypointSchema).describe('Array of waypoints with location, date, and objective'),
  budgetTier: z.enum(['budget', 'mid-range', 'luxury', 'ultra-luxury']).describe('Budget tier for accommodations'),
  accommodationType: z.enum(['hotel', 'hostel', 'resort', 'apartment', 'guesthouse', 'bnb']).describe('Type of accommodation'),
  limit: z.number().min(1).max(20).default(10).describe('Number of accommodations to return (max 20)')
});

export const accommodationWorkflowTool = createTool({
  id: 'accommodation-workflow-tool',
  description: 'Search for accommodations using a workflow that merges waypoints, formulates optimized queries, and returns structured accommodation data',
  inputSchema: accommodationWorkflowToolInputSchema,
  outputSchema: accommodationWorkflowOutputSchema,
  execute: async ({ context }) => {
    const run = await accommodationWorkflow.createRun();
    const result = await run.start({
      inputData: context,
    });
    
    if (result.status === 'success') {
      console.log("result", result.result);
      return result.result;
    } else if (result.status === 'failed') {
      throw new Error(`Accommodation workflow failed: ${result.error?.message || 'Unknown error'}`);
    } else {
      throw new Error(`Accommodation workflow was suspended unexpectedly`);
    }
  },
});

// Export the tool for use in agents
export default accommodationWorkflowTool; 