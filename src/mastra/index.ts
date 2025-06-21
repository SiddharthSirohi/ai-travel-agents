import { Mastra } from '@mastra/core/mastra';
import { diningWorkflow } from './workflows/dining-workflow';
import { orchestratorAgent } from './agents/orchestrator-agent';

export const mastra = new Mastra({
  workflows: { 
    'dining-workflow': diningWorkflow 
  },
  agents: { orchestrator: orchestratorAgent },
  // Remove LibSQL storage to avoid serverless compatibility issues
  // Storage can be added later when needed for persistence
});
