export type NodeEnv = 'development' | 'production' | 'test';

export const environment = {
  nodeEnv: (process.env.NODE_ENV as NodeEnv) ?? 'development',
};
