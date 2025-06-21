import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { diningWorkflow } from './workflows/dining-workflow';
import { orchestratorAgent } from './agents/orchestrator-agent';

export const mastra = new Mastra({
  workflows: { 
    'dining-workflow': diningWorkflow 
  },
  agents: { orchestrator: orchestratorAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
