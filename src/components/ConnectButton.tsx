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
import { useEffect } from "react";

type Props = {
  handleOpenModal: any;
};

export default function ConnectButton({ handleOpenModal }: Props) {
  const { activateBrowserWallet, library, account, chainId, switchNetwork } = useEthers();
  const etherBalance = useEtherBalance(account);
  const { isOpen, onOpen, onClose } = useDisclosure();

  function checkNetwork() {
    if (!chainId) {
      switchNetwork(Moonbeam.chainId).catch(error => {
        console.log('error in switchNetwork', error);
      });
    }
  }

  async function handleConnectWallet() {
    if (!account) {
      try {
        await activateBrowserWallet();
      } catch (error) {
        console.log('error in activateBrowserWallet', error);
        onOpen();
      }
    }

    if (!chainId) {
      checkNetwork();
    }
  }

  useEffect(() => {
    checkNetwork();
  }, [account])

  return account && chainId ? (
    <Box
      display="flex"
      alignItems="center"
      background="gray.700"
      borderRadius="xl"
      py="0"
    >
      <Box px="3">
        <Text color="white" fontSize="md">
          {etherBalance && parseFloat(formatEther(etherBalance)).toFixed(3)} GLMR
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
            <Text color="white">In order to connect wallet, you should have it installed as a browser extension.
              You can install it from <Link href='href={"https://metamask.io/"}' isExternal color='teal.500'>here</Link>. Or try to check if your wallet extension is turned on and ready for incoming connections</Text>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Button
        onClick={handleConnectWallet}
        bg="blue.800"
        color="blue.300"
        fontSize="lg"
        fontWeight="medium"
        borderRadius="xl"
        border="1px solid transparent"
        _hover={{
          borderColor: "blue.700",
          color: "blue.400",
        }}
        _active={{
          backgroundColor: "blue.800",
          borderColor: "blue.700",
        }}
      >
        {!account ? "Connect wallet" : "Change Network"}
      </Button>
    </>
  );
}
