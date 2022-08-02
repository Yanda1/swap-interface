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
import { useEthers, useEtherBalance, Moonbeam } from '@usedapp/core';
import { formatEther } from '@ethersproject/units';
import Identicon from './Identicon';
import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { ButtonEnum, buttonType, useStore, KycEnum } from '../helpers/context';
import { VerificationEnum, KycStatusEnum } from '../helpers/context';
import {
	MOONBEAM_URL,
	useLocalStorage,
	useKyc,
	loadBinanceKycScript,
	makeBinanceKycCall,
	LOCAL_STORAGE_KEY,
	getAuthTokensFromNonce,
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
	const [storage, setStorage] = useLocalStorage(LOCAL_STORAGE_KEY, null); // TODO: check logic for default value
	const { state, dispatch } = useStore();
	const { isUserVerified, isAccountConnected, isNetworkConnected, buttonStatus } = state;

	const checkNetwork = useCallback(async () => {
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
	}, [chainId]);

	const handleButtonClick = async () => {
		if (!isAccountConnected) {
			try {
				await activateBrowserWallet();
			} catch (error) {
				console.log('error in activateBrowserWallet', error);
				onOpen();
			}
		}

		if (!isNetworkConnected) {
			await checkNetwork();
		}

		if (!isNetworkConnected && !isAccountConnected) {
			toast({
				title: 'Something went wrong',
				description:
					'Please make sure that you are connected to the internet, signed in to your Metamask account and have the right network selected',
				status: 'error',
				duration: 5000,
				isClosable: true,
			});
		}

		if (isAccountConnected && isNetworkConnected) {
			getAuthTokensFromNonce(account!, library)
				.then((res: any) => {
					setStorage({
						account: account,
						access: res.access,
						refresh: res.refresh,
						is_kyced: false,
					}); // check with Daniel if this is the right place
					setAuthToken(res.access);
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
		});

		if (account) {
			dispatch({ type: VerificationEnum.ACCOUNT, payload: true });
		} else {
			dispatch({ type: VerificationEnum.ACCOUNT, payload: false });
		}

		if (chainId) {
			dispatch({ type: VerificationEnum.NETWORK, payload: true });
		} else {
			dispatch({ type: VerificationEnum.NETWORK, payload: false });
			checkNetwork();
		}

		if (account && chainId && storage) {
			if (account !== storage.account) {
				dispatch({
					type: ButtonEnum.BUTTON,
					payload: buttonType.PASS_KYC,
				});
				toast({
					title: 'Wrong account',
					description:
						'Please sign in with the account that has already passed KYC or start the KYC process again',
					status: 'warning',
					duration: 5000,
					isClosable: true,
				});
			} else {
				if (storage['is_kyced']) {
					dispatch({ type: KycEnum.STATUS, payload: KycStatusEnum.PASS });
				} else {
					setAuthToken(storage.access);
					if (kycToken && kycStatus) {
						dispatch({ type: KycEnum.STATUS, payload: kycStatus as any }); // check typing
						setStorage({ ...storage, is_kyced: kycStatus === KycStatusEnum.PASS });
					} else {
						setAuthToken(storage.refresh);
						if (kycToken && kycStatus) {
							// TODO: why is kycStatus still '' and doesn't trigger a re-render?
							dispatch({ type: KycEnum.STATUS, payload: kycStatus as any }); // TODO: check typing
						} else {
							dispatch({
								type: ButtonEnum.BUTTON,
								payload: buttonType.GET_NONCE,
							});
							// getAuthTokensFromNonce(account!, library)
							// 	.then((res: any) => {
							// 		setStorage({
							// 			account: account,
							// 			access: res.access,
							// 			refresh: res.refresh,
							// 			is_kyced: false,
							// 		}); // TOOD: check with Daniel if this is the right place
							// 		setAuthToken(res.access);
							// 	})
							// 	.catch((err) => {
							// 		toast({
							// 			title: 'Something went wrong',
							// 			description: err.message,
							// 			status: 'error',
							// 			duration: 5000,
							// 			isClosable: true,
							// 		});
							// 	});
						}
					}
				}
			}
		}

		if (!storage) {
			dispatch({
				type: ButtonEnum.BUTTON,
				payload: buttonType.PASS_KYC,
			});
		}

		if (kycToken && kycScriptLoaded && !storage.is_kyced) makeBinanceKycCall(kycToken);
	}, [chainId, account, authToken, kycToken, toast, kycStatus, dispatch, setStorage, checkNetwork]); // TODO: add storage dependency

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
				bg={`${buttonStatus.color}.800`}
				color={`${buttonStatus.color}.300`}
				fontSize='lg'
				fontWeight='medium'
				borderRadius='xl'
				border='1px solid transparent'
				_hover={{
					borderColor: `${buttonStatus.color}.700`,
					color: `${buttonStatus.color}.400`,
				}}
				_active={{
					backgroundColor: `${buttonStatus.color}.800`,
					borderColor: `${buttonStatus.color}.700`,
				}}
				_focus={{
					backgroundColor: `${buttonStatus.color}.800`,
					borderColor: `${buttonStatus.color}.700`,
				}}
			>
				{buttonStatus.text}
			</Button>
		</>
	);
};

export default ConnectButton;
