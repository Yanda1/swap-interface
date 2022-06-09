import { ReactNode } from "react";
import { Flex } from "@chakra-ui/react";

type Props = {
  children?: ReactNode;
};

export default function TopMenuLayout({ children }: Props) {
  return (
    <Flex
    //   flexDirection="column"
      alignItems="center"
      justifyContent="right"
      h="10vh"
      bg="gray.800"
      p="30px"
    >
      {children}
    </Flex>
  );
}
