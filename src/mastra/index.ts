import { Mastra } from '@mastra/core/mastra';
import { diningWorkflow } from './workflows/dining-workflow';
import { orchestratorAgent } from './agents/orchestrator-agent';
import { accommodationWorkflow } from './workflows/accommodation-workflow';
import { feedbackOrchestratorAgent } from './agents/feedback-orchestrator-agent';
import { experiencesWorkflow } from './workflows/experiences-workflow';

export const mastra = new Mastra({
  workflows: { 
    'dining-workflow': diningWorkflow,
    'accommodation-workflow': accommodationWorkflow,
    'experiences-workflow': experiencesWorkflow
  },
  agents: { 
    orchestrator: orchestratorAgent,
    feedbackOrchestrator: feedbackOrchestratorAgent 
  },
  // Remove LibSQL storage to avoid serverless compatibility issues
  // Storage can be added later when needed for persistence
});
