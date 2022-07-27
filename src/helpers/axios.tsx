import axios from 'axios';
import { useEffect, useState, useRef } from 'react';

type Axios = {
  url: string;
  method?: 'GET' | 'POST';
  payload?: object;
};

export const BASE_URL = 'https://auth-app-aq3rv.ondigitalocean.app/';
export const BINANCE_PROD_URL = 'https://api.commonservice.io';
export const BINANCE_DEV_URL = 'https://dip-qacb.sdtaop.com';
export const BINANCE_SCRIPT =
  'https://static.saasexch.com/static/binance/static/kyc-ui/sdk/0.0.2/sdk.js';
export const MOONBEAM_URL = 'https://rpc.api.moonbeam.network';
export const apiCall = {
  getNonce: 'nonce?address=',
  auth: 'auth',
  kycToken: 'kyc/token',
  kycStatus: 'kyc/status',
  refresh: 'refresh',
};

export const useAxios = ({ url, method, payload }: Axios): any => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const controllerRef = useRef(new AbortController());

  const cancel = () => {
    controllerRef.current.abort();
  };

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.request({
          data: payload,
          signal: controllerRef.current.signal,
          method: method ?? 'GET',
          url,
        });
        setData(response.data);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  return { cancel, data, error, loaded };
};

export const getMetamaskMessage = (nonce: string): string =>
  `0x${Buffer.from(
    'Please sign this one time nonce: ' + nonce,
    'utf8'
  ).toString('hex')}`;
