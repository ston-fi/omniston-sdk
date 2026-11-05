export function retrieveEnvVariable(key: string, defaultValue?: string) {
  const value = process.env[key] ?? defaultValue;

  if (!value) {
    throw new Error(`${key} not configured`);
  }

  return value;
}
