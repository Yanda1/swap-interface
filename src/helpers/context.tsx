import { createContext, useReducer, useContext } from 'react';

type Action = {
  type:
    | 'SET_ACCOUNT_CONNECTED'
    | 'SET_NETWORK_CONNECTED'
    | 'SET_KYC_CONNECTED'
    | 'SET_USER_CONNECTED';
  payload: boolean;
};
type Dispatch = (action: Action) => void;
type State = {
  isUserVerified: boolean;
  isAccountConnected: boolean;
  isNetworkConnected: boolean;
  isKycPassed: boolean;
};
type CountProviderProps = { children: React.ReactNode };
type Reducer = {
  ACCOUNT: string;
  NETWORK: string;
  KYC: string;
  USER: string;
};

const reducer: Reducer = {
  ACCOUNT: 'SET_ACCOUNT_CONNECTED',
  NETWORK: 'SET_NETWORK_CONNECTED',
  KYC: 'SET_KYC_PASSED',
  USER: 'SET_USER_VERIFIED',
};

const AuthContext = createContext<
  { state: State; dispatch: Dispatch } | undefined
>(undefined);

const authReducer = (state: State, action: Action) => {
  switch (action.type) {
    case reducer.ACCOUNT:
      return { ...state, accountConnected: action.payload };
    case reducer.NETWORK:
      return { ...state, networkConnected: action.payload };
    case reducer.KYC:
      return { ...state, kycPassed: action.payload };
    case reducer.USER:
      return { ...state, isUserVerified: action.payload };
    default:
      throw new Error(`Unhandled action type ${action.type}`);
  }
};

export const AuthProvider = (children: CountProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, {
    isUserVerified: false,
    isAccountConnected: false,
    isNetworkConnected: false,
    isKycPassed: false,
  });
  const value = { state, dispatch };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
