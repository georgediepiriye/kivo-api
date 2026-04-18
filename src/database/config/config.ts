import promptSync from "prompt-sync";
import config from "../../config/config.js";

// 1. Keep the Enum for consistency
enum ENVS {
  TEST = "test",
  DEV = "development",
  STAGE = "staging",
  PROD = "production",
}

// 2. Map the URLs from your new config structure
const configEnvs = {
  [ENVS.DEV]: {
    url: config.db.url as string,
  },
  [ENVS.TEST]: {
    // Better to have a dedicated TEST_DATABASE_URL,
    // but this fallback works if your dev URL is local
    url: config.db.url?.replace("Kivo", "Kivo-Test") as string,
  },
  [ENVS.STAGE]: {
    url: config.db.url as string, // config.db.url already handles env logic
  },
  [ENVS.PROD]: {
    url: config.db.url as string,
  },
};

const selectDB = (
  env: ENVS, // Use the Enum type here
  devOverride: boolean = true,
): { url: string } => {
  const database = configEnvs[env];

  if (!database || !database.url) {
    throw new Error(`No database URL found for environment: ${env}`);
  }

  const isCloudDB = database.url.startsWith("mongodb+srv://");

  switch (env) {
    case ENVS.TEST:
      // Safety: Never let tests run against Atlas (Cloud)
      if (isCloudDB) {
        throw new Error(
          `❌ TERMINATING: You are trying to run tests against a CLOUD database. Use a local DB.`,
        );
      }
      break;

    case ENVS.DEV:
      if (isCloudDB) {
        if (!devOverride) {
          throw new Error(
            `❌ TERMINATING: Seed/Dev override disabled for Cloud DB.`,
          );
        }

        // Use prompt-sync to get manual confirmation
        const prompt = promptSync();
        console.log(
          `\n⚠️  \x1b[31mWARNING\x1b[0m: Connection string detected as CLOUD (Atlas).`,
        );
        const userConfirmation = prompt(
          `Are you sure you want to proceed with ${env} operations? (y/n): `,
        );

        if (userConfirmation.toLowerCase() !== "y") {
          throw new Error("Process terminated by user.");
        }
      }
      break;

    default:
      break;
  }

  return database;
};

export default selectDB;
