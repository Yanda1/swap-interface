import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

enum VerificationEnum {
  ACCOUNT = 'SET_ACCOUNT_CONNECTED',
  NETWORK = 'SET_NETWORK_CONNECTED',
  KYC = 'SET_KYC_PASSED',
  USER = 'SET_USER_VERIFIED',
}

enum ButtonEnum {
  BUTTON = 'SET_BUTTON_STATE',
}
export interface Verification {
  type: VerificationEnum;
  payload: boolean;
}
interface Button {
  type: ButtonEnum;
  payload: { color: string; text: string };
}

type Action = Verification | Button;

type State = {
  isUserVerified: boolean;
  isAccountConnected: boolean;
  isNetworkConnected: boolean;
  isKycPassed: boolean;
  button: { color: string; text: string };
};

type ButtonType = {
  CONNECT_WALLET: { color: string; text: string };
  CHANGE_NETWORK: { color: string; text: string };
  PASS_KYC: { color: string; text: string };
};

const buttonState: ButtonType = {
  CONNECT_WALLET: { color: 'blue', text: 'Connect Wallet' },
  CHANGE_NETWORK: { color: 'red', text: 'Change Network' },
  PASS_KYC: { color: 'orange', text: 'Pass KYC' },
};

const initialState: State = {
  isUserVerified: false,
  isAccountConnected: false,
  isNetworkConnected: false,
  isKycPassed: false,
  button: buttonState.CONNECT_WALLET,
};

type Reducer = {
  ACCOUNT: string;
  NETWORK: string;
  KYC: string;
  USER: string;
  BUTTON: string;
};

export const reducer: Reducer = {
  ACCOUNT: 'SET_ACCOUNT_CONNECTED',
  NETWORK: 'SET_NETWORK_CONNECTED',
  KYC: 'SET_KYC_PASSED',
  USER: 'SET_USER_VERIFIED',
  BUTTON: 'SET_BUTTON_STATE',
};

type Dispatch = (action: Action) => void;

const AuthContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const authReducer = (state: any, action: any) => {
  switch (action.type) {
    case reducer.ACCOUNT:
      return { ...state, isAccountConnected: action.payload };
    case reducer.NETWORK:
      return { ...state, isNetworkConnected: action.payload };
    case reducer.KYC:
      return { ...state, isKycPassed: action.payload };
    case reducer.BUTTON:
      return { ...state, button: action.payload };
    case reducer.USER:
      return { ...state, isUserVerified: action.payload };
    default:
      throw new Error(`Unhandled action type ${action.type}`);
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const value = { state, dispatch };
  const { isAccountConnected, isNetworkConnected, isKycPassed } = state;

  useEffect(() => {
    if (isKycPassed && isNetworkConnected && isAccountConnected) {
      dispatch({ type: reducer.USER, payload: true });
    }
    if (!isKycPassed || !isNetworkConnected || !isAccountConnected) {
      dispatch({ type: reducer.USER, payload: false });
    }
    if (!isAccountConnected) {
      dispatch({
        type: reducer.BUTTON,
        payload: buttonState.CONNECT_WALLET,
      });
    }
    if (!isNetworkConnected) {
      dispatch({
        type: reducer.BUTTON,
        payload: buttonState.CHANGE_NETWORK,
      });
    }
    if (!isKycPassed && isNetworkConnected && isAccountConnected) {
      dispatch({
        type: reducer.BUTTON,
        payload: buttonState.PASS_KYC,
      });
    }
  }, [isAccountConnected, isNetworkConnected, isKycPassed]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
