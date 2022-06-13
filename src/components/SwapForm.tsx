import { useState, useRef } from 'react';
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
} from '@chakra-ui/react';
import { useEthers } from '@usedapp/core';
import RadioCard from './RadioCard';
import CurrenciesModal from './CurrenciesModal';
import SwapButton from './SwapButton';
const availableCoins = require('../availableCoins.json');
export default function SwapForm() {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()
  const { chainId, library: web3Provider } = useEthers();
  // State vars declaration
  const [estimatedResult, setEstimatedResult] = useState(0);
  const [destCurrency, setDestCurrency] = useState('BTC');
  const [availableNetworks, setAvailableNetworks] = useState(getAssetNetworks(destCurrency));
  const { value: destNetwork, getRootProps, getRadioProps } = useRadioGroup({
    onChange: onChangeDestNetwork,
  })
  const group = getRootProps()
  const [amount, setAmount] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const { isOpen, onOpen: showChangeCurrency, onClose } = useDisclosure();
  const swapButtonRef = useRef();
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
  function onChangeDestNetwork(value: any) {
    console.log('Network', value)
  }
  function onCurrencySelected(value: any) {
    const networks = getAssetNetworks(value)
    setAvailableNetworks(networks);
    setDestCurrency(value);
  }
  async function onSubmit(values: any) {
    console.log('Form values:', values)
    setAmount(values['amount'])
    setDestAddress(values['destAddr'])
    // @ts-ignore
    swapButtonRef.current.onSubmit();
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
            {availableNetworks.map((value: string) => {
              return (
                <RadioCard key={value} {...getRadioProps({ value: value })}>
                  {value}
                </RadioCard>
              )
            })}
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
      {chainId ?
        <SwapButton ref={swapButtonRef} amount={amount} destCurrency={destCurrency} destNetwork={destNetwork} destAddr={destAddress} isSubmitting={isSubmitting} />
        :
        <Text fontSize='lg' fontWeight='bold' color='red.400' mt={5}>Please Change Network</Text>
      }
      {/* { errorMessage &&
        <>
        <p>{createStatus}</p>
        <p>{errorMessage}</p>
        </>
      } */}
    </form>
  )
}
