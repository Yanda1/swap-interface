/* eslint-disable no-duplicate-case */
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { DAppProvider, Config, Moonbeam } from "@usedapp/core";
import { Localhost } from "./web3/chains";
import { legacy_createStore } from "redux";
import { Provider } from "react-redux";
import { store, persistor } from "./store";
import { PersistGate } from "redux-persist/integration/react";



const config: Config = {
  readOnlyChainId: Moonbeam.chainId,
  readOnlyUrls: {
    [Moonbeam.chainId]: 'https://rpc.api.moonbeam.network',
    // [Localhost.chainId]: 'http://127.0.0.1:8545',
  },
  networks: [Moonbeam],
}






ReactDOM.render(
  <React.StrictMode>
    <DAppProvider config={config}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </DAppProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
