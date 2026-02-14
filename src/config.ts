function assertEnvVar(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

export default {
  siteName: assertEnvVar("SITE_NAME"),
  authUser: assertEnvVar("AUTH_USER"),
  authPass: assertEnvVar("AUTH_PASS"),
};
