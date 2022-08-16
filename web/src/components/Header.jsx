import { Flex, Button, Text, useTheme } from "@aws-amplify/ui-react";

const Header = ({ signOut }) => {
  const { tokens } = useTheme();

  return (
    <Flex
      padding={`0 ${tokens.space.small}`}
      height={tokens.space.xl}
      width={"100vw"}
      direction={"row"}
    >
      <Flex
        justifyContent={"flex-start"}
        alignItems={"center"}
        width={"80%"}
        height={"100%"}
      >
        <Text fontSize={"large"} fontWeight={"medium"}>
          Pet Tracking Map
        </Text>
      </Flex>
      <Flex
        justifyContent={"flex-end"}
        alignItems={"center"}
        width={"20%"}
        height={"100%"}
      >
        <Button onClick={signOut} variation={"primary"}>
          Sign out
        </Button>
      </Flex>
    </Flex>
  );
};

export default Header;
