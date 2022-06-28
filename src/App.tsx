import { ChakraProvider, useDisclosure } from "@chakra-ui/react";
import "@fontsource/inter";
import { useEffect, useState, useRef } from "react"

import theme from "./theme";
import TopMenuLayout from "./components/TopMenuLayout";
import ContentLayout from "./components/ContentLayout";
import ConnectButton from "./components/ConnectButton";
import AccountModal from "./components/AccountModal";
import SwapForm from "./components/SwapForm";
import AccordionLog from "./components/AccordionLog";
import { initAction } from "./store/accordionReducer";
import { useDispatch, useSelector } from "react-redux";
require('dotenv').config({ path: '.env' });


function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const accordions = useSelector((state: any) => state.accordion)
  const dispatch = useDispatch();

  const updateData = (value: string) => {
    dispatch(initAction({ productId: value }))
  };

  return (
    <ChakraProvider theme={theme}>
      <TopMenuLayout>
        <ConnectButton handleOpenModal={onOpen} />
        <AccountModal isOpen={isOpen} onClose={onClose} />
      </TopMenuLayout>
      <ContentLayout>
        <SwapForm updateData={updateData} />
      </ContentLayout>
      {Object.keys(accordions).map((key) => {
        return (
          <AccordionLog key={key} productId={key} />
        )
      })}


    </ChakraProvider >
  );
}
export default App;
