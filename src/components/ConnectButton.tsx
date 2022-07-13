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
} from "@chakra-ui/react";
import { useEthers, useEtherBalance, Moonbeam } from "@usedapp/core";
import { formatEther } from "@ethersproject/units";
import Identicon from "./Identicon";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

type Props = {
  handleOpenModal: any;
};

type ButtonType = {
  CONNECT_WALLET: { color: string; text: string };
  CHANGE_NETWORK: { color: string; text: string };
  PASS_KYC: { color: string; text: string };
};

const button: ButtonType = {
  CONNECT_WALLET: { color: "blue", text: "Connect Wallet" },
  CHANGE_NETWORK: { color: "red", text: "Change Network" },
  PASS_KYC: { color: "orange", text: "Pass KYC" },
};

export default function ConnectButton({ handleOpenModal }: Props) {
  const { activateBrowserWallet, library, account, chainId, switchNetwork } =
    useEthers();
  const etherBalance = useEtherBalance(account);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [buttonInfo, setButtonInfo] = useState(button.CONNECT_WALLET);
  const [kycPassed, setKycPassed] = useState(false);
  const [networkConnected, setNetworkConnected] = useState(false);
  const [accountConnected, setAccountConnected] = useState(false);
  const [userVerified, setUserVerified] = useState(false);

  console.log({
    userVerified,
    accountConnected,
    networkConnected,
    kycPassed,
    account,
    chainId,
  });

  async function checkNetwork() {
    const network_params = [
      {
        chainId: ethers.utils.hexValue(Moonbeam.chainId),
        chainName: Moonbeam.chainName,
        rpcUrls: ["https://rpc.api.moonbeam.network"],
        nativeCurrency: {
          name: "Glimer",
          symbol: "GLMR",
          decimals: 18,
        },
        blockExplorerUrls: ["https://moonscan.io/"],
      },
    ];

    if (!chainId) {
      await switchNetwork(Moonbeam.chainId);
      if (chainId !== Moonbeam.chainId) {
        // @ts-ignore
        await library.send("wallet_addEthereumChain", network_params);
      }
    }
  }

  async function handleConnectWallet() {
    if (!account) {
      try {
        await activateBrowserWallet();
      } catch (error) {
        console.log("error in activateBrowserWallet", error);
        onOpen();
      }
    } else {
      setButtonInfo(button.CHANGE_NETWORK);
    }
    if (!chainId) {
      await checkNetwork();
    }
  }

  useEffect(() => {
    const checkNetwork = async () => {
      if (!chainId) {
        await checkNetwork();
      }
    };
    checkNetwork();

    if (chainId) setNetworkConnected(true);
    if (account) setAccountConnected(true);
    if (networkConnected && accountConnected && !kycPassed)
      setButtonInfo(button.PASS_KYC);
    if (!accountConnected) setButtonInfo(button.CONNECT_WALLET);
    if (accountConnected && !chainId) setButtonInfo(button.CHANGE_NETWORK);
    if (kycPassed && networkConnected && accountConnected) {
      setUserVerified(true);
    }
  }, [chainId, account, kycPassed, networkConnected, accountConnected]);

  return userVerified ? (
    <Box
      display="flex"
      alignItems="center"
      background="gray.700"
      borderRadius="xl"
      py="0"
    >
      <Box px="3">
        <Text color="white" fontSize="md">
          {etherBalance && parseFloat(formatEther(etherBalance)).toFixed(3)}{" "}
          GLMR
        </Text>
      </Box>
      <Button
        onClick={handleOpenModal}
        bg="gray.800"
        border="1px solid transparent"
        _hover={{
          border: "1px",
          borderStyle: "solid",
          borderColor: "blue.400",
          backgroundColor: "gray.700",
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
              color: "whiteAlpha.700",
            }}
          />
          <ModalBody pt={0} px={4}>
            <Text color="white">
              In order to connect wallet, you should have it installed as a
              browser extension. You can install it from{" "}
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
        onClick={handleConnectWallet}
        bg={`${buttonInfo.color}.800`}
        color={`${buttonInfo.color}.300`}
        fontSize="lg"
        fontWeight="medium"
        borderRadius="xl"
        border="1px solid transparent"
        _hover={{
          borderColor: `${buttonInfo.color}.700`,
          color: `${buttonInfo.color}.400`,
        }}
        _active={{
          backgroundColor: `${buttonInfo.color}.800`,
          borderColor: `${buttonInfo.color}.700`,
        }}
        _focus={{
          backgroundColor: `${buttonInfo.color}.800`,
          borderColor: `${buttonInfo.color}.700`,
        }}
      >
        {buttonInfo.text}
      </Button>
    </>
  );
}
