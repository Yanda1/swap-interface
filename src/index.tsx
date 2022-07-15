import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { DAppProvider, Config, Moonbeam } from "@usedapp/core";

// import { Localhost } from "./web3/chains";

const config: Config = {
  readOnlyChainId: Moonbeam.chainId,
  readOnlyUrls: {
    [Moonbeam.chainId]: "https://rpc.api.moonbeam.network",
    // [Localhost.chainId]: 'http://127.0.0.1:8545',
  },
  networks: [Moonbeam],
};

ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <App />
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
