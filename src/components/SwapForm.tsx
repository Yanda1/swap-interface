import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  NumberInput,
  NumberInputField,
  InputRightElement,
  Button,
  RadioGroup,
  Stack,
  useRadioGroup,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { utils } from 'ethers';
import { Contract } from '@ethersproject/contracts';
import { useEthers, useContractFunction, useSendTransaction } from '@usedapp/core';

import RadioCard from './RadioCard';
import CurrenciesModal from './CurrenciesModal';
import { CONTRACT_ADDRESSES } from '../web3/constants';
import CONTRACT_DATA from '../web3/YandaExtendedProtocol.json';
const availableCoins = require('../availableCoins.json');

export default function SwapForm() {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()
  const { account, chainId, library: web3Provider } = useEthers();
  const toast = useToast();

  // State vars declaration
  const [estimatedResult, setEstimatedResult] = useState(0);
  const [destCurrency, setDestCurrency] = useState('BTC');
  const [availableNetworks, setAvailableNetworks] = useState(getAssetNetworks(destCurrency));
  
  const { value: destNetwork, getRootProps, getRadioProps } = useRadioGroup({
    onChange: onChangeNetwork,
  })
  const group = getRootProps()
  
  const { isOpen, onOpen: showChangeCurrency, onClose } = useDisclosure();

  // @ts-ignore
  const contractAddress = CONTRACT_ADDRESSES[chainId];
  const contractInterface = new utils.Interface(CONTRACT_DATA.abi)
  const contract = new Contract(contractAddress, contractInterface, web3Provider)
  if(web3Provider) {
    contract.connect(web3Provider.getSigner());
  }
  
  const { state: createState, send: sendCreateProcess } = useContractFunction(contract, 'createProcess', { transactionName: 'Request Swap' });
  const { sendTransaction, state: depositState } = useSendTransaction({ transactionName: 'Deposit' });
  const { errorMessage, status: createStatus } = createState;

  useEffect(() => {
    if (createState.status.toString() == 'Mining') {
      toast({
        title: 'Waiting',
        description: "Transaction is minting at this moment, soon it will be confirmed...",
        status: 'info',
        duration: 9000,
        isClosable: true,
      })
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

    console.log('createState', createState);
  }, [createState])

  useEffect(() => {
    if (depositState.status.toString() == 'Mining') {
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

    console.log('depositState', depositState);
  }, [depositState])

  function getAssetPrice() {
    // TODO replace with the real price calc logic
    return 0.00004259
  }
  
  function getAssetNetworks(currency: string) {
    return availableCoins[currency];
  }
  
  function onChangeAmount(value: any) {
    if (value === '-' || value <= 0) {
      setEstimatedResult(0);
    } else {
      setEstimatedResult(Number((value * getAssetPrice()).toFixed(8)));
    }
  }
  
  function onChangeNetwork(value: any) {
    console.log('Network', value)
  }

  function onCurrencySelected(value: any) {
    const networks = getAssetNetworks(value)
    setAvailableNetworks(networks);
    setDestCurrency(value);
  }

  function makeid(length: number) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  async function onSubmit(values: any) {
    const productId = utils.id(makeid(32));;
    const shortNamedValues = JSON.stringify({
      'scoin': 'GLMR',
      'samt': utils.parseEther(values['amount']).toString(),
      'fcoin': destCurrency,
      'net': destNetwork,
      'daddr': values['destAddr'],
      // 'tag': '',
    });
    console.log('shortNamedValues', shortNamedValues);

    // const serviceAddress = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
    const serviceAddress = '0xeB56c1d19855cc0346f437028e6ad09C80128e02';
    await sendCreateProcess(serviceAddress, productId, shortNamedValues);

    const filter = contract.filters.CostResponse(account, serviceAddress, productId);
    console.log('filter', filter);
    contract.on(filter, (customer, service, productId, cost, event) => {
      console.log('Oracle cost estimation:', utils.formatEther(cost));
      sendTransaction({ to: contractAddress, value: cost });
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl maxW={'20rem'} isInvalid={errors.amount || errors.destAddr} color={'white'}>

        <FormLabel htmlFor='amount'>Amount to SWAP</FormLabel>
        <NumberInput id='amount' onChange={onChangeAmount} isInvalid={errors.amount}>
          <NumberInputField
            {...register('amount', {
              required: 'This is required',
              min: { value: 0, message: 'Value should be grater than 0' },
            })}
          />
          <InputRightElement width='4.5rem'>
            <Button h='1.75rem' size='sm' color={'black'}>
              GLMR
            </Button>
          </InputRightElement>
        </NumberInput>
        <FormErrorMessage>
          {errors.amount && errors.amount.message}
        </FormErrorMessage>

        <NumberInput id='convertedAmount' mt="20px" isReadOnly={true} isInvalid={false} value={estimatedResult}>
          <NumberInputField />
          <InputRightElement width='4.5rem'>
            <Button h='1.75rem' size='sm' color={'black'} onClick={showChangeCurrency}>
              {destCurrency}
            </Button>
          </InputRightElement>
        </NumberInput>
        
        <CurrenciesModal isOpen={isOpen} onClose={onClose} currencies={Object.keys(availableCoins)} onSelected={onCurrencySelected} />

        <FormLabel mt="20px" htmlFor='destNetwork'>Destination Network</FormLabel>
        <RadioGroup id='destNetwork'>
          <Stack direction='row' wrap="wrap" align="left" {...group}>
            { availableNetworks.map((value: string) => {
              return (
                <RadioCard key={value} {...getRadioProps({ value: value })}>
                  {value}
                </RadioCard>
              )
            }) }
          </Stack>
        </RadioGroup>

        <FormLabel mt="20px" htmlFor='destAddr'>Destination Address</FormLabel>
        <Input
          id='destAddr'
          placeholder='0x...'
          isInvalid={errors.destAddr}
          {...register('destAddr', {
            required: 'This is required',
          })}
        />
        <FormErrorMessage>
          {errors.destAddr && errors.destAddr.message}
        </FormErrorMessage>

      </FormControl>
      <Button mt={4} colorScheme='teal' isLoading={isSubmitting} type='submit'>
        SWAP
      </Button>
      {/* { errorMessage &&
        <>
        <p>{createStatus}</p>
        <p>{errorMessage}</p>
        </>
      } */}
    </form>
  )
}
