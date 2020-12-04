import { Logger } from "tslog";
import { AlpacaClient } from "@master-chief/alpaca";
import Util from "util";

const logger = new Logger({ name: "Main logger" });

interface CredMapping {
  endpoint: string;
  id: string;
  secret: string;
}

interface AlpacaCred {
  endpoint: string;
  id: string;
  secret: string;
}

enum Mode {
  DEV,
  PROD,
}

const MODE_INDICATOR: string = "ALPACA_MODE";

const devCredKeyMapping: CredMapping = {
  endpoint: "ALPACA_DEV_API_ENDPOINT",
  id: "ALPACA_DEV_API_KEY_ID",
  secret: "ALPACA_DEV_API_SECRET_KEY",
};

const prodCredKeyMapping: CredMapping = {
  endpoint: "ALPACA_PROD_API_ENDPOINT",
  id: "ALPACA_PROD_API_KEY_ID",
  secret: "ALPACA_PROD_API_SECRET_KEY",
};

const getCredMapping = (mode: Mode): CredMapping => {
  if (mode == Mode.DEV) {
    return devCredKeyMapping;
  }
  if (mode === Mode.PROD) {
    return prodCredKeyMapping;
  }
  throw Error(`${mode} not valid.`);
};

const getCred = (mode: Mode): AlpacaCred => {
  const credMapping: CredMapping = getCredMapping(mode);
  const endpoint = process.env[credMapping.endpoint];
  const id = process.env[credMapping.id];
  const secret = process.env[credMapping.secret];
  if (id && endpoint && secret) {
    return {
      id: id as string,
      endpoint: endpoint as string,
      secret: secret as string,
    };
  }
  throw Error(`
    Required cred values are missing.
    ID: ${id}, Endpoint: ${endpoint}, Secret: ${secret}
  `);
};

const getMode = (): Mode => {
  if (process.env[MODE_INDICATOR] && process.env[MODE_INDICATOR] === "dev") {
    return Mode.DEV;
  }
  if (process.env[MODE_INDICATOR] && process.env[MODE_INDICATOR] === "prod") {
    return Mode.PROD;
  }
  throw Error(`${MODE_INDICATOR} not found.`);
};

const getClient = async (cred: AlpacaCred): Promise<AlpacaClient> => {
  const client = new AlpacaClient({
    credentials: {
      key: cred.id,
      secret: cred.secret,
    },
    rate_limit: true,
  });

  return client;
};

const alpacaApiWalkthrough = async (): Promise<void> => {
  const mode = getMode();
  const cred = getCred(mode);
  const client = await getClient(cred);
  // Check the get account API
  const account = await client.getAccount();
  logger.info(`Auth response:\n ${Util.inspect(account, true, null, true)}`);
  // Check the create watchlist API
  client.createWatchlist({
    name: "Demo List",
    symbols: ["AAPL", "SPHD", "DIV"],
  });
  // Check the get watch list API
  const watchlist = await client.getWatchlists();
  logger.info(
    `Watchlist response:\n ${Util.inspect(watchlist, true, null, true)}`
  );
  logger.info("Done!");
};

alpacaApiWalkthrough();
