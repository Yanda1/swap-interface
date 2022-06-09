import { ReactNode } from "react";
import { Flex, Box } from "@chakra-ui/react";

type Props = {
  children?: ReactNode;
};

export default function ContentLayout({ children }: Props) {
  return (
    <Flex
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      h="90vh"
      bg="gray.800"
    >
      <Box borderRadius='md' bg="blue.800" p="8">
        {children}
      </Box>
    </Flex>
  );
}
