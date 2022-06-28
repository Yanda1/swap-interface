import { useEffect, forwardRef, useImperativeHandle, useState  } from 'react';
import { StringOrNumber } from "@chakra-ui/utils";
import { useEthers, useContractFunction, useSendTransaction } from '@usedapp/core';
import { utils } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import {
  Button,
  useToast,
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import {setDepositing} from '../store/accordionReducer';
import { CONTRACT_ADDRESSES } from '../web3/constants';
import CONTRACT_DATA from '../web3/YandaExtendedProtocol.json';
type Props = {
  ref: any,
  amount: number;
  destCurrency: string;
  destNetwork: StringOrNumber;
  destAddr: string;
  isSubmitting: boolean;
  tag: string;
  contract: any;
  contractAddress: any;
  updateData: any;
};
const SwapButton = forwardRef(({ amount, destCurrency, destNetwork, destAddr, isSubmitting, tag, contract, contractAddress, updateData}: Props, ref) => {
  const { account, chainId, library: web3Provider } = useEthers();
  const toast = useToast();
  const { state: createState, send: sendCreateProcess } = useContractFunction(contract, 'createProcess', { transactionName: 'Request Swap' });
  const { sendTransaction, state: depositState } = useSendTransaction({ transactionName: 'Deposit' });
  const { errorMessage, status: createStatus } = createState;
  const [productId, setProductId] = useState();
  const dispatch = useDispatch();
  const accordion = useSelector((state: any) => state.accordion[productId])


  useEffect(() => {
    if (createState.status.toString() == 'Mining') {
      toast({
        title: 'Waiting',
        description: "Transaction is minting at this moment, soon it will be confirmed...",
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
      console.log("PRODUCTID------",productId)
      updateData(productId)
    } else if (createState.status.toString() == 'Success') {
      toast({
        title: 'Confirmation',
        description: "Swap request was successfully sent.\nNow waiting for a deposit final amount estimation...",
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    } else if (createState.status.toString() == 'Exception') {
      toast({
        title: 'Something went wrong',
        description: "Looks like transaction wasn't signed and/or sent, \nplease try again if you didn't rejected it by yourself.",
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
  }, [createState])
  useEffect(() => {
    if (depositState.status.toString() == 'Mining') {
      dispatch(setDepositing({value: true, productId: productId}))
      toast({
        title: 'Waiting',
        description: "Transaction is minting at this moment, soon it will be confirmed...",
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
    } else if (depositState.status.toString() == 'Success') {
      toast({
        title: 'Confirmation',
        description: "Your deposit have reached the contract.\nNow waiting for a broker to make the swap...",
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    } else if (depositState.status.toString() == 'Exception') {
      toast({
        title: 'Something went wrong',
        description: "Looks like transaction wasn't signed and/or sent, \nplease try again if you didn't rejected it by yourself.",
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    }
  }, [depositState])
  function makeid(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  useImperativeHandle(ref, () => ({
    async onSubmit() {
      const localProductId = utils.id(makeid(32));
      setProductId(localProductId);
      // const shortNamedValues = JSON.stringify({
      //   'scoin': 'GLMR',
      //   'samt': utils.parseEther(amount).toString(),
      //   'fcoin': destCurrency,
      //   'net': destNetwork,
      //   'daddr': destAddr,
      //   // 'tag': '',
      // });
      
      let namedValues = {
        'scoin': 'GLMR',
        'samt': utils.parseEther(amount).toString(),
        'fcoin': destCurrency,
        'net': destNetwork,
        'daddr': destAddr,
      }

      if (tag) {
        namedValues.tag = tag;
      }

      const shortNamedValues = JSON.stringify(namedValues);

      console.log('shortNamedValues', shortNamedValues);
      // const serviceAddress = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
      const serviceAddress = '0xeB56c1d19855cc0346f437028e6ad09C80128e02';
      console.log("PRODUCTID------",localProductId)
      await sendCreateProcess(serviceAddress, localProductId, shortNamedValues);
      const filter = contract.filters.CostResponse(account, serviceAddress, productId);
      console.log('filter', filter);
      if (!accordion.depositing) {
        contract.on(filter, (customer, service, localProductId, cost, event) => {
          console.log('Oracle cost estimation:', utils.formatEther(cost));
          sendTransaction({ to: contractAddress, value: cost });
        })
      }
    }
  }));
  return (
    <Button mt={4} colorScheme='teal' isLoading={isSubmitting} type='submit'>
      SWAP
    </Button>
  )
});
export default SwapButton;