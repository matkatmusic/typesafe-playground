import type { RunOutput, Version } from '../playgroundHistory';

export type ThemeName = 'dark' | 'light';

export type PageData = { versions: Version[]; hasEnvKey: boolean };

export type RunBody = { calls: number; apiKey: string };

export type RunResult = { outputs: RunOutput[]; version: Version };
