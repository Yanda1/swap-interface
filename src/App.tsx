import { ChakraProvider, useDisclosure } from '@chakra-ui/react';
import { AuthProvider } from './helpers/context';
import '@fontsource/inter';
import theme from './theme';
import TopMenuLayout from './components/TopMenuLayout';
import ContentLayout from './components/ContentLayout';
import ConnectButton from './components/ConnectButton';
import AccountModal from './components/AccountModal';
import SwapForm from './components/SwapForm';

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <AuthProvider>
      <ChakraProvider theme={theme}>
        <TopMenuLayout>
          <ConnectButton handleOpenModal={onOpen} />
          <AccountModal isOpen={isOpen} onClose={onClose} />
        </TopMenuLayout>

        <ContentLayout>
          <SwapForm />
        </ContentLayout>
      </ChakraProvider>
    </AuthProvider>
  );
}

export default App;
