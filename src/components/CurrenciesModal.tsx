import {
  Box,
  Button,
  Flex,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
} from "@chakra-ui/react";
import { ExternalLinkIcon, CopyIcon } from "@chakra-ui/icons";
import Identicon from "./Identicon";

type Props = {
  isOpen: any;
  onClose: any;
  currencies: any;
  onSelected: any;
};

export default function CurrenciesModal({ isOpen, onClose, currencies, onSelected }: Props) {

  function selectCurrency(event: any) {
    onSelected(event.target.innerText);
    onClose();
  }

  return (
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
          Select currency
        </ModalHeader>
        <ModalCloseButton
          color="white"
          fontSize="sm"
          _hover={{
            color: "whiteAlpha.700",
          }}
        />
        <ModalBody pt={0} px={4}>

          { currencies.map((value: any) => {
            return (
              <Box key={value}>
                <Button
                  color="black"
                  textAlign="left"
                  fontWeight="medium"
                  fontSize="md"
                  onClick={selectCurrency}
                >
                  {value}
                </Button>
              </Box>
            )
          }) }

        </ModalBody>

        {/* <ModalFooter
          justifyContent="end"
          background="gray.700"
          borderBottomLeftRadius="3xl"
          borderBottomRightRadius="3xl"
          p={6}
        >
          <Text
            color="white"
            textAlign="left"
            fontWeight="medium"
            fontSize="md"
          >
            Modal footer
          </Text>
        </ModalFooter> */}
      </ModalContent>
    </Modal>
  );
}
