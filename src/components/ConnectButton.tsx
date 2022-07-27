import {
  Button,
  Box,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Link,
} from '@chakra-ui/react';
import { useEthers, useEtherBalance, Moonbeam } from '@usedapp/core';
import { formatEther } from '@ethersproject/units';
import Identicon from './Identicon';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useAuth, buttonInfo, KycEnum } from '../helpers/context';
import { VerificationEnum, KycStatusEnum } from '../helpers/context';
import {
  apiCall,
  BASE_URL,
  BINANCE_DEV_URL,
  BINANCE_SCRIPT,
  getMetamaskMessage,
  MOONBEAM_URL,
} from '../helpers/axios';

type Props = {
  handleOpenModal: any;
};


// check if button status and kyc logic can be put into local storage
// toast if something went wrong
// hook for API calls
// outsource logic from this component

const ConnectButton = ({ handleOpenModal }: Props) => {
  const { activateBrowserWallet, library, account, chainId, switchNetwork } =
    useEthers();
  const etherBalance = useEtherBalance(account);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { state, dispatch } = useAuth();
  const { isUserVerified, button } = state;

  const [kycScriptLoaded, setKycScriptLoaded] = useState(false);
  const [kycToken, setKycToken] = useState('');

  const checkNetwork = async () => {
    const network_params = [
      {
        chainId: ethers.utils.hexValue(Moonbeam.chainId),
        chainName: Moonbeam.chainName,
        rpcUrls: [MOONBEAM_URL],
        nativeCurrency: {
          name: 'Glimer',
          symbol: 'GLMR',
          decimals: 18,
        },
        blockExplorerUrls: ['https://moonscan.io/'],
      },
    ];

    if (!chainId) {
      await switchNetwork(Moonbeam.chainId);
      if (chainId !== Moonbeam.chainId) {
        // @ts-ignore
        await library.send('wallet_addEthereumChain', network_params);
      }
    }
  };

  const handleConnectWallet = async () => {
    if (!account) {
      try {
        await activateBrowserWallet();
      } catch (error) {
        console.log('error in activateBrowserWallet', error);
        onOpen();
      }
    }
    if (!chainId) {
      await checkNetwork();
    }
  };

  const loadBinanceKycScript = (cb?: any) => {
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

  const getAuthToken = () => {
    const LOCAL_STORAGE_AUTH = 'kyc-tokens';
    fetch(`${BASE_URL}${apiCall.getNonce}${account}`)
      .then((res: any) => res.json())
      .then((res: any) => {
        const msg = getMetamaskMessage(res.nonce);
        library?.send('personal_sign', [account, msg]).then((res: any) => {
          fetch(`${BASE_URL}${apiCall.auth}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address: account, signature: res }),
          })
            .then((res: any) => res.json())
            .then((res: any) => {
              localStorage.setItem(
                LOCAL_STORAGE_AUTH,
                JSON.stringify({ access: res.access, refresh: res.refresh })
              );
              fetch(`${BASE_URL}${apiCall.kycToken}`, {
                headers: {
                  Authorization: `Bearer ${res.access}`,
                  // store token in localStorage && kycStatus
                  // implement logic for access token
                  // error handling (atm only happy path)
                  // URL: https://finandy.com/en/auth => redirect from this URL in DEV
                },
              })
                .then((res: any) => res.json())
                .then((res: any) => setKycToken(res.token))
                .catch((err: any) =>
                  console.log(
                    '%c EROR IN LIBRARY CALL FOR KYC TOKEN',
                    'color: red; font-size: 16px;',
                    err
                  )
                );
            })
            .catch((err: any) =>
              console.log(
                '%c EROR IN LIBRARY CALL FOR ACCESS TOKEN',
                'color: red; font-size: 16px;',
                err
              )
            );
        });
      })
      .catch((err: any) =>
        console.log(
          '%c EROR IN NONCE CALL',
          'color: red; font-size: 16px;',
          err
        )
      );
  };

  const handleKycPassed = (e: any) => {
    e.preventDefault();
    const LOCAL_STORAGE_AUTH = 'kyc-tokens';
    const authTokenFromLocalStorage = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_AUTH) as string
    ); // check format => returns 'invalid crypto pattern'
    if (authTokenFromLocalStorage) {
      fetch(`${BASE_URL}${apiCall.kycStatus}`, {
        headers: {
          Authorization: `Bearer ${authTokenFromLocalStorage.access}`,
        },
      })
        .then((res: any) => res.json())
        .then((res: any) => {
          if (res.message === 'Access token has expired') {
            fetch(`${BASE_URL}${apiCall.refresh}`, {
              method: 'POST',
              headers: {
                'Cross-Origin-Request-Method': 'POST',
                Authorization: `Bearer ${authTokenFromLocalStorage.refresh}`,
              },
            })
              .then((res: any) => res.json())
              .then((res: any) => {
                if (res.access) {
                  localStorage.setItem(
                    LOCAL_STORAGE_AUTH,
                    JSON.stringify({ access: res.access, refresh: res.refresh })
                  );
                  fetch(`${BASE_URL}${apiCall.kycStatus}`, {
                    headers: {
                      Authorization: `Bearer ${authTokenFromLocalStorage.access}`,
                    },
                  })
                    .then((res: any) => res.json())
                    .then((res: any) => {
                      console.log('res', res);
                      dispatch({
                        type: KycEnum.STATUS,
                        payload: res.levelInfo.currentLevel.kycStatus,
                      });
                      if (res.levelInfo.currentLevel.kycStatus) {
                        localStorage.setItem(
                          LOCAL_STORAGE_AUTH,
                          JSON.stringify({
                            ...authTokenFromLocalStorage,
                            kycStatus: 'PASS',
                          })
                        );
                      }
                    })
                    .catch((err: any) =>
                      console.log(
                        '%c ERROR IN KYC STATUS CALL AFTER REFRESH TOKEN RECEIVED',
                        'color: red; font-size: 16px;',
                        err
                      )
                    );
                } else {
                  getAuthToken();
                }
              });
          } else {
            dispatch({
              type: KycEnum.STATUS,
              payload: res.levelInfo.currentLevel.kycStatus,
            });
            if (res.levelInfo.currentLevel.kycStatus) {
              localStorage.setItem(
                LOCAL_STORAGE_AUTH,
                JSON.stringify({
                  ...authTokenFromLocalStorage,
                  kycStatus: 'PASS',
                })
              );
            }
          }
        })
        .catch((err: any) =>
          console.log(
            '%c EROR IN LIBRARY CALL FOR KYC STATUS',
            'color: red; font-size: 16px;',
            err
          )
        );
    } else {
      getAuthToken();
    }
  };

  useEffect(() => {
    loadBinanceKycScript(() => {
      setKycScriptLoaded(true);
    });

    const localStorageRes = JSON.parse(
      localStorage.getItem('kyc-tokens') as string
    );

    if (localStorageRes && localStorageRes.kycStatus === KycStatusEnum.PASS) {
      dispatch({ type: KycEnum.STATUS, payload: KycStatusEnum.PASS });
    }

    if (kycScriptLoaded && kycToken) {
      console.log(
        '%c in binance call',
        'color: green; font-size: 20px',
        kycToken
      );
      // if (BinanceKyc) {
      // @ts-ignore
      const binanceKyc = new BinanceKyc({
        authToken: kycToken, // has to be updated with the correct token
        bizEntityKey: 'YANDA', // has to be an ENV variable
        apiHost: BINANCE_DEV_URL, // has to be an ENV variable AND different for PROD and DEV
        // closeCallback: (args) => { window.alert('KYC finished, args:', args) },
        onMessage: ({ typeCode }: any) => {
          if (typeCode === '102') {
            console.log('%c typeCode', 'font-size: 20px', typeCode);
            binanceKyc.switchVisible(true);
          }
        },
      });
      // }
    }

    const handleCheckNetwork = async () => {
      if (!chainId) {
        await checkNetwork();
      }
    };
    handleCheckNetwork();

    if (chainId) {
      dispatch({ type: VerificationEnum.NETWORK, payload: true });
    } else dispatch({ type: VerificationEnum.NETWORK, payload: false });
    if (account) {
      dispatch({ type: VerificationEnum.ACCOUNT, payload: true });
    } else dispatch({ type: VerificationEnum.ACCOUNT, payload: false });
    // eslint-disable-next-line
  }, [chainId, account, kycToken]);

  return isUserVerified ? (
    <Box
      display="flex"
      alignItems="center"
      background="gray.700"
      borderRadius="xl"
      py="0"
    >
      <Box px="3">
        <Text color="white" fontSize="md">
          {etherBalance && parseFloat(formatEther(etherBalance)).toFixed(3)}{' '}
          GLMR
        </Text>
      </Box>
      <Button
        onClick={handleOpenModal}
        bg="gray.800"
        border="1px solid transparent"
        _hover={{
          border: '1px',
          borderStyle: 'solid',
          borderColor: 'blue.400',
          backgroundColor: 'gray.700',
        }}
        borderRadius="xl"
        m="1px"
        px={3}
        height="38px"
      >
        <Text color="white" fontSize="md" fontWeight="medium" mr="2">
          {account &&
            `${account.slice(0, 6)}...${account.slice(
              account.length - 4,
              account.length
            )}`}
        </Text>
        <Identicon />
      </Button>
    </Box>
  ) : (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent
          background="gray.900"
          border="1px"
          borderStyle="solid"
          borderColor="gray.700"
          borderRadius="3xl"
        >
          <ModalHeader color="white" px={4} fontSize="lg" fontWeight="medium">
            Error!
          </ModalHeader>
          <ModalCloseButton
            color="white"
            fontSize="sm"
            _hover={{
              color: 'whiteAlpha.700',
            }}
          />
          <ModalBody pt={0} px={4}>
            <Text color="white">
              In order to connect wallet, you should have it installed as a
              browser extension. You can install it from{' '}
              <Link
                href='href={"https://metamask.io/"}'
                isExternal
                color="teal.500"
              >
                here
              </Link>
              . Or try to check if your wallet extension is turned on and ready
              for incoming connections
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Button
        id="kyc_button"
        onClick={
          button.text === buttonInfo.PASS_KYC
            ? handleKycPassed
            : handleConnectWallet
        }
        bg={`${button.color}.800`}
        color={`${button.color}.300`}
        fontSize="lg"
        fontWeight="medium"
        borderRadius="xl"
        border="1px solid transparent"
        _hover={{
          borderColor: `${button.color}.700`,
          color: `${button.color}.400`,
        }}
        _active={{
          backgroundColor: `${button.color}.800`,
          borderColor: `${button.color}.700`,
        }}
        _focus={{
          backgroundColor: `${button.color}.800`,
          borderColor: `${button.color}.700`,
        }}
      >
        {button.text}
      </Button>
    </>
  );
}

export default ConnectButton;