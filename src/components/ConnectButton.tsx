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
	useToast,
} from '@chakra-ui/react';
import axios from 'axios';
import { useEthers, useEtherBalance, Moonbeam } from '@usedapp/core';
import { formatEther } from '@ethersproject/units';
import Identicon from './Identicon';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ButtonEnum, button as buttonInfo, useStore, KycEnum } from '../helpers/context';
import { VerificationEnum, KycStatusEnum } from '../helpers/context';
import {
	BINANCE_DEV_URL,
	MOONBEAM_URL,
	useLocalStorage,
	useKyc,
	loadBinanceKycScript,
	BIZ_ENTRY_KEY,
	LOCAL_STORAGE_KEY,
	BASE_URL,
	apiCall,
	getMetamaskMessage,
} from '../helpers/axios';

type Props = {
	handleOpenModal: any;
};

const ConnectButton = ({ handleOpenModal }: Props) => {
	const { activateBrowserWallet, library, account, chainId, switchNetwork } = useEthers();
	const etherBalance = useEtherBalance(account);

	const [authToken, setAuthToken] = useState('');
	const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [kycScriptLoaded, setKycScriptLoaded] = useState(false);

	const { kycStatus, kycToken } = useKyc(authToken);
	const [storage, setStorage] = useLocalStorage(LOCAL_STORAGE_KEY, null);
	const { state, dispatch } = useStore();
	const { isUserVerified, button } = state;

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
			// check if this condition is redundant (in useEffect)
			await switchNetwork(Moonbeam.chainId);
			if (chainId !== Moonbeam.chainId) {
				// @ts-ignore
				await library.send('wallet_addEthereumChain', network_params);
			}
		}
	};

	const handleButtonClick = async () => {
		if (!account) {
			// maybe if clause with state vars so it's not been called all the time on click
			try {
				await activateBrowserWallet();
			} catch (error) {
				console.log('error in activateBrowserWallet', error);
				onOpen();
			}
		}

		if (!chainId) {
			// maybe if clause with state vars so it's not been called all the time on click
			await checkNetwork();
		}

		if (account && chainId && kycScriptLoaded) {
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
								.then((res) => {
									console.log('%c account', 'color: red', account, storage, res.data);
									//check if is_kyced already
									setAuthToken(res.data.access);
								}) // if is_kyced TRUE store in localStorage
								.catch((err) => {
									toast({
										title: 'Something went wrong',
										description: err.message,
										status: 'error',
										duration: 5000,
										isClosable: true,
									});
								});
						})
						.catch((err) => {
							toast({
								title: 'Something went wrong',
								description: err.message,
								status: 'error',
								duration: 5000,
								isClosable: true,
							});
						});
				})
				.catch((err) => {
					toast({
						title: 'Something went wrong',
						description: err.message,
						status: 'error',
						duration: 5000,
						isClosable: true,
					});
				});
		}
	};

	useEffect(() => {
		loadBinanceKycScript(() => {
			setKycScriptLoaded(true);
		}); // error handling if script couldn't be loaded

		// const handleCheckNetwork = async () => {
		if (!chainId) {
			checkNetwork();
		}
		// };
		// handleCheckNetwork();

		// if (data) {
		// 	setAuthToken(data.access);
		// }

		if (chainId) {
			dispatch({ type: VerificationEnum.NETWORK, payload: true });
		} else dispatch({ type: VerificationEnum.NETWORK, payload: false });
		if (account) {
			dispatch({ type: VerificationEnum.ACCOUNT, payload: true });
		} else {
			dispatch({ type: VerificationEnum.ACCOUNT, payload: false });
		}
		if (account && chainId && storage) {
			if (account !== storage.account) {
				console.log('%c HERE !!!!!!!!!!!', 'font-size: 20px');
				// make him sign nonce again to check stastus
				dispatch({ type: KycEnum.STATUS, payload: KycStatusEnum.INITIAL });
				toast({
					title: 'Wrong account',
					description:
						'Please switch to the account that has already passed KYC or start the KYC proceess again',
					status: 'warning',
					duration: 5000,
					isClosable: true,
				});
			} else {
				if (storage['is_kyced']) {
					dispatch({ type: KycEnum.STATUS, payload: KycStatusEnum.PASS });
				} else {
					setAuthToken(storage.access);
					// @ts-ignore
					if (kycStatus?.levelInfo?.currentLevel?.kycStatus === 'PASS') {
						// change to kycToken to get binance window
						setStorage({ ...storage, is_kyced: true });
						dispatch({ type: KycEnum.STATUS, payload: KycStatusEnum.PASS });
					}
					// @ts-ignore
					if (kycStatus?.levelInfo?.currentLevel?.kycStatus === 'REVIEW') {
						// change to kycToken to get binance window
						dispatch({ type: ButtonEnum.BUTTON, payload: buttonInfo.CHECK_KYC });
					}
				}
			}
		}

		if (kycToken) {
			// @ts-ignore
			const binanceKyc = new BinanceKyc({
				authToken: kycToken,
				bizEntityKey: BIZ_ENTRY_KEY,
				apiHost: BINANCE_DEV_URL,
				onMessage: ({ typeCode }: any) => {
					if (typeCode === '102') {
						binanceKyc.switchVisible(true);
					}
				},
			});
		}
		// eslint-disable-next-line
	}, [chainId, account, authToken, kycStatus, isUserVerified]);

	return isUserVerified ? (
		<Box display='flex' alignItems='center' background='gray.700' borderRadius='xl' py='0'>
			<Box px='3'>
				<Text color='white' fontSize='md'>
					{etherBalance && parseFloat(formatEther(etherBalance)).toFixed(3)} GLMR
				</Text>
			</Box>
			<Button
				onClick={handleOpenModal}
				bg='gray.800'
				border='1px solid transparent'
				_hover={{
					border: '1px',
					borderStyle: 'solid',
					borderColor: 'blue.400',
					backgroundColor: 'gray.700',
				}}
				borderRadius='xl'
				m='1px'
				px={3}
				height='38px'
			>
				<Text color='white' fontSize='md' fontWeight='medium' mr='2'>
					{account &&
						`${account.slice(0, 6)}...${account.slice(account.length - 4, account.length)}`}
				</Text>
				<Identicon />
			</Button>
		</Box>
	) : (
		<>
			<Modal isOpen={isOpen} onClose={onClose} isCentered size='md'>
				<ModalOverlay />
				<ModalContent
					background='gray.900'
					border='1px'
					borderStyle='solid'
					borderColor='gray.700'
					borderRadius='3xl'
				>
					<ModalHeader color='white' px={4} fontSize='lg' fontWeight='medium'>
						Error!
					</ModalHeader>
					<ModalCloseButton
						color='white'
						fontSize='sm'
						_hover={{
							color: 'whiteAlpha.700',
						}}
					/>
					<ModalBody pt={0} px={4}>
						<Text color='white'>
							In order to connect wallet, you should have it installed as a browser extension. You
							can install it from{' '}
							<Link href='href={"https://metamask.io/"}' isExternal color='teal.500'>
								here
							</Link>
							. Or try to check if your wallet extension is turned on and ready for incoming
							connections
						</Text>
					</ModalBody>
				</ModalContent>
			</Modal>

			<Button
				id='kyc_button'
				onClick={handleButtonClick}
				bg={`${button.color}.800`}
				color={`${button.color}.300`}
				fontSize='lg'
				fontWeight='medium'
				borderRadius='xl'
				border='1px solid transparent'
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
};

export default ConnectButton;
