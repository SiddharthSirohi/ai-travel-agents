/* eslint-disable @typescript-eslint/no-explicit-any */
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { diningWorkflowOutputSchema } from '../workflows/dining-workflow';

// Re-exporting the schema for easy use by the orchestrator
export const diningToolInputSchema = z.object({
  location: z.string().describe('The city or area to search for restaurants'),
  cuisine: z.string().optional().describe('Type of cuisine (e.g., Italian, Chinese, Mexican, etc.)'),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional().describe('Price range from $ (cheap) to $$$$ (expensive)'),
  dietary: z.string().optional().describe('Dietary preference (e.g., vegetarian, vegan, gluten-free)'),
  rating: z.number().min(1).max(5).optional().describe('Minimum rating (1-5 stars)'),
  limit: z.number().min(1).max(20).default(10).describe('Number of restaurants to return (max 20)')
});

export const diningTool = createTool({
  id: 'dining-workflow-tool',
  description: 'Executes a workflow to find and recommend restaurants based on user preferences.',
  inputSchema: diningToolInputSchema,
  outputSchema: diningWorkflowOutputSchema,
  execute: async ({ context, mastra }) => {
    if (!mastra) {
      throw new Error('Mastra instance is not available in the tool context.');
    }
    
    // Get the workflow from the Mastra instance
    const workflow = mastra.getWorkflow('dining-workflow');
    if (!workflow) {
      throw new Error('Could not find the dining-workflow in the Mastra instance.');
    }

    try {
      // Create a run and execute the workflow with the provided context
      const run = workflow.createRun();
      const workflowResult = await run.start({
        inputData: context,
      });

      // Check if the workflow completed successfully and return the result
      // The result should match the diningWorkflowOutputSchema
      return workflowResult as any;
    } catch (error) {
      console.error('Workflow execution error:', error);
      throw new Error(`Failed to execute dining workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 