export interface GatewayConfig {
  port: number;
  jwtSecret: string;
  publicUrl: string;
  upstreamTimeoutMs: number;
  breakerResetMs: number;
  services: { iam: string; projectTask: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const required = (name: string): string => {
    const value = env[name];
    if (!value) throw new Error(`Missing required environment variable ${name}`);
    return value;
  };
  const port = Number(env.PORT ?? 3000);
  return {
    port,
    jwtSecret: required('JWT_SECRET'),
    publicUrl: env.PUBLIC_URL ?? `http://localhost:${port}`,
    upstreamTimeoutMs: Number(env.UPSTREAM_TIMEOUT_MS ?? 5000),
    breakerResetMs: Number(env.BREAKER_RESET_MS ?? 30000),
    services: {
      iam: required('IAM_SERVICE_URL').replace(/\/$/, ''),
      projectTask: required('PROJECT_TASK_SERVICE_URL').replace(/\/$/, ''),
    },
  };
}
