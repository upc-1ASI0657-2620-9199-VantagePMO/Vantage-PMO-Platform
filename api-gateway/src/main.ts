import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const { app } = createApp(config);
app.listen(config.port, () => {
  console.log(`[gateway] Vantage PMO API Gateway listening on port ${config.port}`);
  console.log(`[gateway] IAM -> ${config.services.iam} | Project & Task -> ${config.services.projectTask}`);
});
