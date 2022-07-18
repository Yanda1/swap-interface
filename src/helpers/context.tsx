import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

export enum VerificationEnum {
  ACCOUNT = 'SET_ACCOUNT_CONNECTED',
  NETWORK = 'SET_NETWORK_CONNECTED',
  KYC = 'SET_KYC_PASSED',
  USER = 'SET_USER_VERIFIED',
}

enum ButtonEnum {
  BUTTON = 'SET_BUTTON_STATE',
}

type Verification = {
  type: VerificationEnum;
  payload: boolean;
};

type Button = {
  type: ButtonEnum;
  payload: { color: string; text: string };
};

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

export const buttonInfo = {
  CONNECT_WALLET: 'Connect Wallet',
  CHANGE_NETWORK: 'Change Network',
  PASS_KYC: 'Pass KYC',
};

const button: ButtonType = {
  CONNECT_WALLET: { color: 'blue', text: buttonInfo.CONNECT_WALLET },
  CHANGE_NETWORK: { color: 'red', text: buttonInfo.CHANGE_NETWORK },
  PASS_KYC: { color: 'orange', text: buttonInfo.PASS_KYC },
};

const initialState: State = {
  isUserVerified: false,
  isAccountConnected: false,
  isNetworkConnected: false,
  isKycPassed: false,
  button: button.CONNECT_WALLET,
};

type Dispatch = (action: Action) => void;

const AuthContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const authReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case VerificationEnum.ACCOUNT:
      return { ...state, isAccountConnected: action.payload };
    case VerificationEnum.NETWORK:
      return { ...state, isNetworkConnected: action.payload };
    case VerificationEnum.KYC:
      return { ...state, isKycPassed: action.payload };
    case ButtonEnum.BUTTON:
      return { ...state, button: action.payload };
    case VerificationEnum.USER:
      return { ...state, isUserVerified: action.payload };
    default:
      return state;
    // throw new Error(`Unhandled action type ${action.type}`);
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
      dispatch({ type: VerificationEnum.USER, payload: true });
    }
    if (!isKycPassed || !isNetworkConnected || !isAccountConnected) {
      dispatch({ type: VerificationEnum.USER, payload: false });
    }
    if (!isAccountConnected) {
      dispatch({
        type: ButtonEnum.BUTTON,
        payload: button.CONNECT_WALLET,
      });
    }
    if (!isNetworkConnected) {
      dispatch({
        type: ButtonEnum.BUTTON,
        payload: button.CHANGE_NETWORK,
      });
    }
    if (!isKycPassed && isNetworkConnected && isAccountConnected) {
      dispatch({
        type: ButtonEnum.BUTTON,
        payload: button.PASS_KYC,
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
