import { useEffect, useState } from 'react';
import { useEthers } from '@usedapp/core';
import axios from 'axios';
// cleanup imports / consts
export const BASE_URL = 'https://auth-app-aq3rv.ondigitalocean.app/';
export const BINANCE_PROD_URL = 'https://api.commonservice.io';
export const BINANCE_DEV_URL = 'https://dip-qacb.sdtaop.com';
export const BINANCE_SCRIPT =
	'https://static.saasexch.com/static/binance/static/kyc-ui/sdk/0.0.2/sdk.js';
export const MOONBEAM_URL = 'https://rpc.api.moonbeam.network';
export const BIZ_ENTRY_KEY = 'YANDA';
export const LOCAL_STORAGE_KEY = 'tiwanaku';

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

export const useAuth = (
	account: string,
): {
	loading: boolean;
	error: any;
	data: null | { access: string; refresh: string; is_kyced: boolean };
} => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);
	const { library } = useEthers();

	useEffect(() => {
		axios
			.request({
				url: `${BASE_URL}${apiCall.getNonce}${account}`,
			})
			.then((res) => {
				const msg = getMetamaskMessage(res.data.nonce);
				library
					?.send('personal_sign', [account, msg])
					.then((res) => {
						axios
							.request({
								url: `${BASE_URL}${apiCall.auth}`,
								method: 'POST',
								data: { address: account, signature: res },
							})
							.then((res) => setData(res.data)) // if is_kyced TRUE store in localStorage
							.catch((err) => setError(err))
							.finally(() => setLoading(false));
					})
					.catch((err) => setError(err))
					.finally(() => setLoading(false));
			})
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	}, [account]);

	return { loading, error, data };
};
// type KycStatus = {
//   levelInfo: {
//     completedLevel: any;
//     currentLevel: any;
//     definedKycPassLevel: any;
//     hasMultipleLevels: any;
//     kycPass: any;
//   };
//   statusInfo: object;

// }

export const useKyc = (
	authToken: string,
): { loading: boolean; error: any; kycStatus: object; kycToken: string } => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [kycStatus, setKycStatus] = useState({});
	const [kycToken, setKycToken] = useState('');

	useEffect(() => {
		axios
			.request({
				url: `${BASE_URL}${apiCall.kycStatus}`,
				headers: {
					Authorization: `Basic ${authToken}`,
				},
			})
			.then((res) => setKycStatus(res.data))
			.catch((err) => setError(err))
			.finally(() => setLoading(false));

		axios
			.request({
				url: `${BASE_URL}${apiCall.kycToken}`,
				headers: {
					Authorization: `Basic ${authToken}`,
				},
			})
			.then((res) => setKycToken(res.data.token))
			.catch((err) => setError(err))
			.finally(() => setLoading(false));
	}, [authToken]);

	return { loading, error, kycStatus, kycToken };
};
