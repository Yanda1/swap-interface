/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useEffect } from 'react';
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
  Text,
  Box,
  useRadioGroup,
  useDisclosure,
} from '@chakra-ui/react';
import { useEthers } from '@usedapp/core';
import RadioCard from './RadioCard';
import CurrenciesModal from './CurrenciesModal';
import SwapButton from './SwapButton';
import Graph from "../utils/Graph"
import { pathToFileURL } from 'url';
import { CONTRACT_ADDRESSES } from '../web3/constants';
import CONTRACT_DATA from '../web3/YandaExtendedProtocol.json';
import { Contract, utils } from 'ethers';
const availableCoins = require('../availableCoins.json');

export default function SwapForm({ updateData }: any) {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm()
  const { chainId, library: web3Provider } = useEthers();
  // State vars declaration
  const [estimatedResult, setEstimatedResult] = useState(0);
  const [startCurrency, setStartCurrency] = useState('GLMR')
  const [destCurrency, setDestCurrency] = useState('BTC');
  const [availableNetworks, setAvailableNetworks] = useState(getAssetNetworks(destCurrency));
  const { value: destNetwork, getRootProps, getRadioProps, } = useRadioGroup({
    onChange: onChangeDestNetwork,
  })

  const group = getRootProps()
  const [amount, setAmount] = useState(0);
  const [destAddress, setDestAddress] = useState('');
  const [tag, setTag] = useState("");

  const { isOpen, onOpen: showChangeCurrency, onClose } = useDisclosure();
  const swapButtonRef = useRef();
  interface Ticker {
    symbol: string;
    price: string;
  }
  const [allPrices, setAllPrices] = useState<Ticker[]>([]);
  const [graph, setGraph] = useState(null);
  const [allPairs, setAllPairs] = useState([]);
  const [graphPath, setGraphPath] = useState({});

  useEffect(() => {
    fetch(`https://api.binance.com/api/v3/exchangeInfo`)
      .then((res) => res.json())
      .then((data) => setAllPairs(data.symbols))
  }, []);

  useEffect(() => {
    const localGraph = new Graph();
    for (let i = 0; i < allPairs.length; i++) {
      // @ts-ignore
      localGraph.addEdge(allPairs[i].baseAsset, allPairs[i].quoteAsset)
      if (allPairs.length === localGraph.edges) {
        //@ts-ignore
        setGraph(localGraph)
      }
    }
  }, [allPairs]);


  useEffect(() => {
    fetch(`https://api.binance.com/api/v3/ticker/price`)
      .then((res) => res.json())
      .then((data) => {
        setAllPrices(data);
      })
  }, [destCurrency, startCurrency])

  useEffect(() => {
    if (graph) {
      setGraphPath(graph.bfs(startCurrency, destCurrency))
    }
  }, [destCurrency, startCurrency, graph]);


  async function finalPrice(graphPath: any, tickers: Ticker[]) {
    let price = 0;
    for (let i = 0; i < graphPath.distance; i++) {
      console.log(`${graphPath.path[i]} -> ${graphPath.path[i + 1]}`)
      let edge_price = 0;
      let ticker: any = tickers.find((x: any) => x.symbol === graphPath.path[i] + graphPath.path[i + 1]);
      if (ticker) {
        edge_price = ticker.price
      } else {
        ticker = tickers.find((x: any) => x.symbol === graphPath.path[i + 1] + graphPath.path[i]);
        edge_price = 1 / ticker.price
      }
      if (price === 0) {
        price = edge_price
      } else {
        price *= edge_price
      }
    }
    setEstimatedResult(Number((amount * price).toFixed(8)));
  }

  useEffect(() => {
    if (amount <= 0) {
      setEstimatedResult(0)
    } else {
      finalPrice(graphPath, allPrices)
    }
  }, [amount, graphPath, allPrices])


  function getAssetNetworks(currency: string) {
    return availableCoins[currency];
  }

  function onChangeDestNetwork(value: any) {
    console.log('Network', value)
  }
  function onCurrencySelected(value: any) {
    console.log("onCurrencySelected", value)
    const networks = getAssetNetworks(value)
    setAvailableNetworks(networks);

    setDestCurrency(value);
  }

  async function onSubmit(values: any) {
    console.log('Form values:', values)
    setDestAddress(values['destAddr'])
    setTag(values['tag'])
    // @ts-ignore
    swapButtonRef.current.onSubmit();
  }
  // @ts-ignore
  const contractAddress = chainId ? CONTRACT_ADDRESSES[chainId] : null;
  const contractInterface = new utils.Interface(CONTRACT_DATA.abi)
  const contract = new Contract(contractAddress, contractInterface, web3Provider)
  if (web3Provider) {
    contract.connect(web3Provider.getSigner());
  }

  // useEffect(async () => {
  //   try {
  //     const filter = await contract.filters.CostRequest('0xaf82890a2862aa87d005091e2960179e90f0cb8a', '0xeB56c1d19855cc0346f437028e6ad09C80128e02', '0x85097b99961f0eb572f82f824936c10b3970abf97c322ad3688f3ad5c5b64911');
  //     const events = await contract.queryFilter(filter, 1281778)
  //     console.log("---COST REQUEST EVENTS---", events)
  //     if (events) {
  //       updateData(events[0])
  //       updateData(events[1])
  //     }
  //   } catch (error) {
  //     console.log("NO EVENTS COST REQUEST")
  //   }
  //   try {
  //     const filter = await contract.filters.Deposit('0xaf82890a2862aa87d005091e2960179e90f0cb8a', '0xeB56c1d19855cc0346f437028e6ad09C80128e02', '0x85097b99961f0eb572f82f824936c10b3970abf97c322ad3688f3ad5c5b64911');
  //     const events = await contract.queryFilter(filter, 1281778)
  //     console.log("---DEPOSIT EVENTS---", events)
  //     if (events) {
  //       updateData(events[0])
  //     }
  //   } catch (error) {
  //     console.log("NO EVENTS DEPOSIT")
  //   }
  //   try {
  //     const filter = await contract.filters.Action('0xaf82890a2862aa87d005091e2960179e90f0cb8a', '0xeB56c1d19855cc0346f437028e6ad09C80128e02', '0x85097b99961f0eb572f82f824936c10b3970abf97c322ad3688f3ad5c5b64911');
  //     const events = await contract.queryFilter(filter, 1281778)
  //     console.log("---Action EVENTS---", events)
  //     if (events) {
  //       updateData(events[0])
  //       updateData(events[1])
  //     }
  //   } catch (error) {
  //     console.log("NO EVENTS Action")
  //   }
  //   try {
  //     const filter = await contract.filters.Complete('0xaf82890a2862aa87d005091e2960179e90f0cb8a', '0xeB56c1d19855cc0346f437028e6ad09C80128e02', '0x85097b99961f0eb572f82f824936c10b3970abf97c322ad3688f3ad5c5b64911');
  //     const events = await contract.queryFilter(filter, 1281778)
  //     console.log("---Complete EVENTS---", events)
  //     if (events) {
  //       updateData(events[0])
  //     }
  //   } catch (error) {
  //     console.log("NO EVENTS Complete")
  //   }
  // }, [])



  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormControl maxW={'20rem'} isInvalid={errors.amount || errors.destAddr || errors.tag} color={'white'}>
        <FormLabel htmlFor='amount'>Amount to SWAP</FormLabel>
        <NumberInput id='amount' onChange={(value: any) => setAmount(value)} isInvalid={errors.amount} min={18}>
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
            {availableNetworks.map((value: any) => {
              return (
                <RadioCard key={value.name} {...getRadioProps({ value: value.name })}>
                  {value.name}
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
        {availableNetworks.find((value: any) => value.name === destNetwork && value.hasTag)
          ? (
            <>
              <FormLabel mt="20px" htmlFor='tag'>Memo: </FormLabel>
              <Input
                id='tag'
                placeholder='Address memo...'
                isInvalid={errors.tag}
                {...register('tag', {
                  required: 'This is required',
                })}
              />
              <FormErrorMessage>
                {errors.tag && errors.tag.message}
              </FormErrorMessage>
            </>)
          : null
        }

      </FormControl>
      {chainId ?
        <SwapButton
          ref={swapButtonRef}
          amount={amount}
          destCurrency={destCurrency}
          destNetwork={destNetwork}
          destAddr={destAddress}
          isSubmitting={isSubmitting}
          tag={tag}
          contract={contract}
          contractAddress={contractAddress}
          updateData={updateData}
        />

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

