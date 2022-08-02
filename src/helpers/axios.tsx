import { useEffect, useState } from 'react';
import axios from 'axios';

export const BASE_URL = 'https://auth-app-aq3rv.ondigitalocean.app/';
export const BINANCE_PROD_URL = 'https://api.commonservice.io';
export const BINANCE_DEV_URL = 'https://dip-qacb.sdtaop.com';
export const BINANCE_SCRIPT =
	'https://static.saasexch.com/static/binance/static/kyc-ui/sdk/0.0.2/sdk.js';
export const MOONBEAM_URL = 'https://rpc.api.moonbeam.network';
export const BIZ_ENTRY_KEY = 'YANDA';
export const LOCAL_STORAGE_KEY = 'tiwanaku';

export enum STATUS_ENUM {
	NONCE = 'NONCE',
	AUTH = 'AUTH',
	PASS = 'PASS',
}

type LocalStorageProps = {
	is_kyc: string;
	refresh: string;
	access: string;
	account: string;
} | null;

export const apiCall = {
	getNonce: 'nonce?address=',
	auth: 'auth',
	kycToken: 'kyc/token',
	kycStatus: 'kyc/status',
	refresh: 'refresh',
};

export const getMetamaskMessage = (nonce: string): string =>
	`0x${Buffer.from('Please sign this one time nonce: ' + nonce, 'utf8').toString('hex')}`;

export const loadBinanceKycScript = (cb?: any) => {
	const existingId = document.getElementById('binance-kcy-script');

	if (!existingId) {
		const binanceSdkScript = document.createElement('script');
		binanceSdkScript.src = BINANCE_SCRIPT;
		binanceSdkScript.id = 'binance-kcy-script';
		document.body.appendChild(binanceSdkScript);

		binanceSdkScript.onload = () => {
			if (cb) cb();
		};
	}

	if (existingId && cb) cb();
};

export const makeBinanceKycCall = (authToken: string) => {
	// @ts-ignore
	const binanceKyc = new BinanceKyc({
		authToken,
		bizEntityKey: BIZ_ENTRY_KEY,
		apiHost: BINANCE_DEV_URL,
		onMessage: ({ typeCode }: any) => {
			if (typeCode === '102') {
				binanceKyc.switchVisible(true);
			}
		},
		// closeCallback: () => {
		// 	console.log('%c in Binanace call', 'color: red; font-size: 20px');
		// 	axios
		// 		.request({
		// 			url: `${BASE_URL}${apiCall.kycStatus}`,
		// 			headers: {
		// 				Authorization: `Bearer ${authToken}`,
		// 			},
		// 		})
		// 		.then((res: any) => {
		// 			const { dispatch } = useStore();
		// 			console.log('res.data.levelInfo.currentLevel', res.data.levelInfo.currentLevel);
		// 			if (res.data.levelInfo.currentLevel.kycStatus === 'PASS') {
		// 				dispatch({ type: VerificationEnum.USER, payload: true });
		// 			} else {
		// 				dispatch({ type: KycEnum.STATUS, payload: res.data.levelInfo.currentLevel.kycStatus }); // payload: KycStastusEnum[res.data.levelInfo.currentLevel.kycStatus]
		// 				dispatch({ type: ButtonEnum.BUTTON, payload: button.CHECK_KYC });
		// 			}
		// 		})
		// 		.catch((err) => {
		// 			throw new Error(err);
		// 		});
		// },
	});
};

const getStorageValue = (key: string, defaultValue: LocalStorageProps) => {
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem(key);
		return saved !== null ? JSON.parse(saved) : defaultValue;
	}
};

export const useLocalStorage = (key: string, defaultValue: LocalStorageProps) => {
	const [value, setValue] = useState(() => {
		return getStorageValue(key, defaultValue);
	});

	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
};

export const getAuthTokensFromNonce = (account: string, library: any) => {
	return new Promise((resolve, reject) => {
		axios
			.request({
				url: `${BASE_URL}${apiCall.getNonce}${account}`,
			})
			.then((res) => {
				const msg = getMetamaskMessage(res.data.nonce);

				library
					?.send('personal_sign', [account, msg])
					.then((res: any) => {
						axios
							.request({
								url: `${BASE_URL}${apiCall.auth}`,
								method: 'POST',
								data: { address: account, signature: res },
							})
							.then((res) => resolve(res.data)) // if is_kyced TRUE store in localStorage
							.catch((err) => reject(err));
						// .finally(() => setLoading(false));
					})
					.catch((err: any) => reject(err));
				// .finally(() => setLoading(false));
			})
			.catch((err) => reject(err));
		// .finally(() => setLoading(false));
	});
};

export const useKyc = (
	authToken: string,
): { loading: boolean; error: any; kycStatus: string; kycToken: string } => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [kycStatus, setKycStatus] = useState('');
	const [kycToken, setKycToken] = useState('');

	useEffect(() => {
		axios
			.request({
				url: `${BASE_URL}${apiCall.kycStatus}`,
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			})
			.then((res) => setKycStatus(res.data.levelInfo.currentLevel.kycStatus)) // TODO: check typing and if kycStatus is from right place
			.catch((err) => setError(err))
			.finally(() => setLoading(false));

		axios
			.request({
				url: `${BASE_URL}${apiCall.kycToken}`,
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			})
			.then((res) => setKycToken(res.data.token))
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	}, [authToken]);

	return { loading, error, kycStatus, kycToken };
};
