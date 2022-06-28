import initialState from "./initial";

const COSTREQUESTCOUNER = "COSTREQUESTCOUNER";
const DEPOSITBLOCK = "DEPOSITBLOCK";
const ACTIONS = "Actions";
const WITHDRAW = "Withdraw";
const COMPLETE = "Complete";
const INIT = "Init";
const REMOVE = "Remove";
const DEPOSITING = "Depositing";

export const accordionReducer = (state = {}, action) => {
    let productId;
    let newState;
    if (action.payload && action.payload.productId) {
        productId = action.payload.productId;
    } else {
        return state;
    }

    switch (action.type) {
        case INIT:
            newState = { ...state };
            if (!state[productId]) {
                newState[productId] = initialState;
                newState[productId].productId = productId;
            }
            return newState;
        case COSTREQUESTCOUNER:
            newState = { ...state };
            newState[productId].costRequestsCounter += 1;
            return newState;
        case DEPOSITBLOCK:
            newState = { ...state };
            newState[productId].depositBlock = action.payload.value;
            return newState;
        case ACTIONS:
            newState = { ...state };
            newState[productId].orders.push(action.payload.value);
            return newState;
        case WITHDRAW:
            newState = { ...state };
            newState[productId].withdraw = action.payload.value;
            return newState;
        case COMPLETE:
            newState = { ...state };
            newState[productId].complete = action.payload.value;
            return newState;
        case REMOVE:
            newState = { ...state };
            delete newState[productId];
            return newState;
        case DEPOSITING:
            newState = { ...state };
            newState[productId].depositing = action.payload.value;
            return newState;
        default:
            return state;
    }
};

export const costRequestsCounterAction = (payload) => ({
    type: COSTREQUESTCOUNER,
    payload,
});
export const depositBlockAction = (payload) => ({
    type: DEPOSITBLOCK,
    payload,
});
export const actionsAction = (payload) => ({
    type: ACTIONS,
    payload,
});
export const withdrawAction = (payload) => ({
    type: WITHDRAW,
    payload,
});
export const completeAction = (payload) => ({
    type: COMPLETE,
    payload,
});
export const initAction = (payload) => ({
    type: INIT,
    payload,
});
export const removeAccordion = (payload) => ({
    type: REMOVE,
    payload,
});
export const setDepositing = (payload) => ({
    type: REMOVE,
    payload,
});
