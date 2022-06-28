import { legacy_createStore, combineReducers } from "redux";
import { accordionReducer } from "./accordionReducer";

import { composeWithDevTools } from "@redux-devtools/extension";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const rootReducer = combineReducers({
    accordion: accordionReducer,
});

const persistConfig = {
    key: "accordions",
    storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = legacy_createStore(
    persistedReducer,
    composeWithDevTools()
);
const persistor = persistStore(store);
export { persistor };
