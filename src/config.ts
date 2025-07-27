import fs from "fs";
import os from "os";
import path from "path";

type Config = {
  dbUrl: string;
  currentUserName: string;
};

export function setUser(userName: string) {
  const config = readConfig();
  config.currentUserName = userName;
  writeConfig(config);
}

export function readConfig(): Config {
  const configFilePath = getConfigFilePath();
  if (!fs.existsSync(configFilePath)) {
    throw new Error("Config file not found");
  } else {
    const data = fs.readFileSync(configFilePath, "utf-8");
    const rawConfig = JSON.parse(data);
    const config = validateConfig(rawConfig);
    return config;
  }
}
function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}
function writeConfig(cfg: Config): void {
  const configFilePath = getConfigFilePath();
  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  fs.writeFileSync(configFilePath, JSON.stringify(rawConfig, null, 2));
}
function validateConfig(rawConfig: any): Config {
  if (!rawConfig.db_url || typeof rawConfig.db_url !== "string") {
    throw new Error("db_url is required in config file");
  }
  if (
    !rawConfig.current_user_name ||
    typeof rawConfig.current_user_name !== "string"
  ) {
    throw new Error("current_user_name is required in config file");
  }

  const config: Config = {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };

  return config;
}
