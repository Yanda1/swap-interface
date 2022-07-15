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
import { useEffect } from 'react';
import { ethers } from 'ethers';
import { reducer, useAuth } from '../helpers/context';
import type { Verification } from '../helpers/context';

type Props = {
  handleOpenModal: any;
};

export default function ConnectButton({ handleOpenModal }: Props) {
  const { activateBrowserWallet, library, account, chainId, switchNetwork } =
    useEthers();
  const etherBalance = useEtherBalance(account);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { state, dispatch } = useAuth();
  const { isUserVerified, button } = state;

  const checkNetwork = async () => {
    const network_params = [
      {
        chainId: ethers.utils.hexValue(Moonbeam.chainId),
        chainName: Moonbeam.chainName,
        rpcUrls: ['https://rpc.api.moonbeam.network'],
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

  const handleKycPassed = async () => {
    console.log('%c !!! START KYC PROCESS', 'color: orange');
  };

  useEffect(() => {
    const handleCheckNetwork = async () => {
      if (!chainId) {
        await checkNetwork();
      }
    };
    handleCheckNetwork();

    if (chainId) {
      dispatch({ type: reducer.NETWORK, payload: true } as Verification);
    } else dispatch({ type: reducer.NETWORK, payload: false } as Verification);
    if (account) {
      dispatch({ type: reducer.ACCOUNT, payload: true } as Verification);
    } else dispatch({ type: reducer.ACCOUNT, payload: false } as Verification);
    // eslint-disable-next-line
  }, [chainId, account]);

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
        onClick={
          button.text === 'Pass KYC' ? handleKycPassed : handleConnectWallet
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
