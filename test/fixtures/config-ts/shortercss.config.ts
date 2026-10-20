interface FixtureConfig {
  processors: Record<string, never>;
  ignores: { classes: string[] };
}

const config: FixtureConfig = { processors: {}, ignores: { classes: ["from-ts"] } };

export default config;
