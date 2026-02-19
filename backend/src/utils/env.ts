export type NodeEnv = "dev" | "test" | "prod" | "production";

export const getEnv = (): NodeEnv => {
  return (process.env.NODE_ENV as NodeEnv) || "dev";
};

export const isProd = (): boolean => {
  const env = getEnv();
  return env === "prod";
};

export const isDev = (): boolean => {
  return getEnv() === "dev";
};

export const isTest = (): boolean => {
  return getEnv() === "test";
};
