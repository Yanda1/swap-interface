import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';

export enum VerificationEnum {
	ACCOUNT = 'SET_ACCOUNT_CONNECTED',
	NETWORK = 'SET_NETWORK_CONNECTED',
	USER = 'SET_USER_VERIFIED',
}

export enum KycEnum {
	STATUS = 'SET_KYC_STATUS',
}

export enum KycStatusEnum {
	INITIAL = 'INITIAL',
	SKIP = 'SKIP',
	REVIEW = 'REVIEW',
	PROCESS = 'PROCESS',
	PASS = 'PASS',
	REJECT = 'REJECT',
}

export enum ButtonEnum {
	BUTTON = 'SET_BUTTON_STATUS',
}

type Verification = {
	type: VerificationEnum;
	payload: boolean;
};

type KycStatus = {
	type: KycEnum;
	payload: KycStatusEnum;
};

type Button = {
	type: ButtonEnum;
	payload: { color: string; text: string };
};

type Action = Verification | Button | KycStatus;

type State = {
	isUserVerified: boolean;
	isAccountConnected: boolean;
	isNetworkConnected: boolean;
	kycStatus: KycStatusEnum;
	buttonStatus: { color: string; text: string };
};

type ButtonStatus = {
	// TODO: refactor type
	CONNECT_WALLET: { color: string; text: string };
	CHANGE_NETWORK: { color: string; text: string };
	PASS_KYC: { color: string; text: string };
	CHECK_KYC: { color: string; text: string };
	GET_NONCE: { color: string; text: string };
};

export const buttonText = {
	CONNECT_WALLET: 'Connect Wallet',
	CHANGE_NETWORK: 'Change Network',
	PASS_KYC: 'Pass KYC',
	CHECK_KYC: 'Check KYC',
	GET_NONCE: 'Get Nonce',
};

export const buttonType: ButtonStatus = {
	CONNECT_WALLET: { color: 'blue', text: buttonText.CONNECT_WALLET },
	CHANGE_NETWORK: { color: 'red', text: buttonText.CHANGE_NETWORK },
	PASS_KYC: { color: 'orange', text: buttonText.PASS_KYC },
	CHECK_KYC: { color: 'green', text: buttonText.CHECK_KYC },
	GET_NONCE: { color: 'purple', text: buttonText.GET_NONCE },
};

const initialState: State = {
	isUserVerified: false,
	isAccountConnected: false,
	isNetworkConnected: false,
	kycStatus: KycStatusEnum.INITIAL, // TOOD: from localStorage?
	buttonStatus: buttonType.CONNECT_WALLET,
};

type Dispatch = (action: Action) => void;

const AuthContext = createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined);

const authReducer = (state: State, action: Action): State => {
	switch (action.type) {
		case VerificationEnum.ACCOUNT:
			return { ...state, isAccountConnected: action.payload };
		case VerificationEnum.NETWORK:
			return { ...state, isNetworkConnected: action.payload };
		case KycEnum.STATUS:
			return { ...state, kycStatus: action.payload };
		case ButtonEnum.BUTTON:
			return { ...state, buttonStatus: action.payload };
		case VerificationEnum.USER:
			return { ...state, isUserVerified: action.payload };
		default:
			return state;
	}
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);
	const value = { state, dispatch };
	const { isAccountConnected, isNetworkConnected, kycStatus } = state;

	useEffect(() => {
		if (!isAccountConnected) {
			dispatch({
				type: ButtonEnum.BUTTON,
				payload: buttonType.CONNECT_WALLET,
			});
		}

		if (!isNetworkConnected && isAccountConnected) {
			dispatch({
				type: ButtonEnum.BUTTON,
				payload: buttonType.CHANGE_NETWORK,
			});
		}

		if (
			(kycStatus === KycStatusEnum.REJECT || kycStatus === KycStatusEnum.INITIAL) &&
			isNetworkConnected &&
			isAccountConnected
		) {
			dispatch({
				type: ButtonEnum.BUTTON,
				payload: buttonType.PASS_KYC,
			});
		}

		if (
			kycStatus === KycStatusEnum.SKIP || // TODO: what is skip used for / does it exist?
			kycStatus === KycStatusEnum.PROCESS ||
			kycStatus === KycStatusEnum.REVIEW
		) {
			dispatch({
				type: ButtonEnum.BUTTON,
				payload: buttonType.CHECK_KYC,
			});
		}

		if (kycStatus === KycStatusEnum.PASS && isNetworkConnected && isAccountConnected) {
			dispatch({ type: VerificationEnum.USER, payload: true });
		}
	}, [isAccountConnected, isNetworkConnected, kycStatus]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useStore = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useStore must be used within a AuthProvider');
	}
	return context;
};
