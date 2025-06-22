import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { experiencesWorkflow, experiencesWorkflowOutputSchema } from '../workflows/experiences-workflow';
import { waypointSchema } from '../../lib/pre-plan';

// Input schema for the experiences workflow tool
const experiencesWorkflowToolInputSchema = z.object({
  waypoints: z.array(waypointSchema).describe('Array of waypoints with location, date, and objective'),
  budgetRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Budget range from $ (cheap) to $$$$ (expensive)'),
  travellerCount: z.number().min(1).max(20).default(2).describe('Number of people traveling'),
  travelStyle: z.string().optional().describe('Travel style preference (e.g., cultural, adventurous, relaxed)')
});

export const experiencesWorkflowTool = createTool({
  id: 'experiences-workflow-tool',
  description: 'Find and select morning and afternoon experiences for each day using a workflow that analyzes objectives and returns structured experience data with coordinates',
  inputSchema: experiencesWorkflowToolInputSchema,
  outputSchema: experiencesWorkflowOutputSchema,
  execute: async ({ context }) => {
    const run = await experiencesWorkflow.createRun();
    const result = await run.start({
      inputData: context,
    });
    
    if (result.status === 'success') {
      console.log("experiences workflow result", result.result);
      return result.result;
    } else if (result.status === 'failed') {
      throw new Error(`Experiences workflow failed: ${result.error?.message || 'Unknown error'}`);
    } else {
      throw new Error(`Experiences workflow was suspended unexpectedly`);
    }
  },
});

// Export the tool for use in agents
export default experiencesWorkflowTool; 