/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, } from 'react';
import { format } from 'date-fns'
import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
} from '@chakra-ui/react'
import { useBlockNumber, useEthers } from '@usedapp/core';
import { CONTRACT_ADDRESSES } from '../web3/constants';
import CONTRACT_DATA from '../web3/YandaExtendedProtocol.json';
import { Contract, utils } from 'ethers';
import { useDispatch, useSelector } from 'react-redux';
import {
    actionsAction,
    costRequestsCounterAction,
    depositBlockAction,
    completeAction,
    withdrawAction,
    removeAccordion,
} from '../store/accordionReducer';
import initialState from '../store/initial'
import { setTimeout } from 'timers';


type Props = {
    productId: string;
}

const AccordionLog = ({ productId }: Props) => {
    const { account, chainId, library: web3Provider } = useEthers();
    const currentBlockNumber = useBlockNumber();
    const dispatch = useDispatch();
    const accordion = useSelector((state: any) => state.accordion[productId]) || initialState;

    useEffect(() => {
        if (!productId || !account) {
            return;
        }
        //@ts-ignore
        const contractAddress = chainId ? CONTRACT_ADDRESSES[chainId] : null;
        const contractInterface = new utils.Interface(CONTRACT_DATA.abi)
        const contract = new Contract(contractAddress, contractInterface, web3Provider)

        const serviceAddress = '0xeB56c1d19855cc0346f437028e6ad09C80128e02';
        if (accordion.costRequestsCounter < 2) {
            contract.on(contract.filters.CostRequest(account, serviceAddress, productId), (customer, service, localProductId, validators, data, event) => {
                dispatch(costRequestsCounterAction({ value: 1, productId: productId }))
            });
        }
        if (!accordion.depositBlock) {
            contract.on(contract.filters.Deposit(account, serviceAddress, productId), (customer, service, localProductId, amount, event) => {
                dispatch(depositBlockAction({ value: event.blockNumber, productId: productId }))
            });
        }
        if (!accordion.withdraw) {
            contract.on(contract.filters.Action(account, serviceAddress, productId), (customer, service, localProductId, data, event) => {
                let parsedData = JSON.parse(event.args?.data)
                if (typeof parsedData.s === "string") {
                    dispatch(actionsAction({ value: parsedData, productId: productId }))
                } else {
                    dispatch(withdrawAction({ value: true, productId: productId }))
                }
            });
        }
        if (!accordion.complete) {
            contract.on(contract.filters.Complete(account, serviceAddress, productId), (customer, service, localProductId, success, event) => {
                dispatch(completeAction({ value: event.args?.success, productId: productId }))
                setTimeout(() => {
                    dispatch(removeAccordion({ productId: productId }))
                }, 5000);
            });
        }
    }, [productId, account])

    return (
        <Accordion defaultIndex={[0]} allowMultiple>
            {accordion.costRequestsCounter
                ? (<AccordionItem >
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                {accordion.costRequestsCounter}/2
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        Your swap request is passing validation at that moment. Please wait.
                    </AccordionPanel>
                </AccordionItem>)
                : null
            }
            {accordion.depositBlock && currentBlockNumber
                ? (<AccordionItem >
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                {currentBlockNumber - accordion.depositBlock}/30
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        Your deposit is waiting for the particular numbers of the blocks to pass. Please wait.
                    </AccordionPanel>
                </AccordionItem>)
                : null}
            {accordion.orders[0]
                ? (<AccordionItem key={accordion.orders[0].s} >
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                Convertion {accordion.orders[0].s}
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        Type:{accordion.orders[0].a === 1 ? "BUY" : "SELL"}
                        <br />
                        Pair:{accordion.orders[0].s}
                        <br />
                        Quantity:{accordion.orders[0].q}
                        <br />
                        Price:{accordion.orders[0].p}
                        <br />
                        Time: {format(new Date(accordion.orders[0].ts * 1000), 'dd/MM/yyyy kk:mm:ss')}
                    </AccordionPanel>
                </AccordionItem>)

                : null
            }
            {accordion.withdraw === true
                ? (<AccordionItem >
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                Withdrawal...
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        Funds should be soon received at the destination address you specified before.
                    </AccordionPanel>
                </AccordionItem>)
                : null
            }
            {accordion.complete === true
                ? (<AccordionItem >
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                "Successful swap"
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        "Your swap process ended, thank you for using Tiwanaku.".
                    </AccordionPanel>
                </AccordionItem>)
                : null}
            {accordion.complete === null
                ? (<AccordionItem >
                    <h2>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                "Unsuccessful swap"
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        "Unsuccessful swap, something going wrong...".
                    </AccordionPanel>
                </AccordionItem>)
                : null
            }
        </Accordion >
    )


}

export default AccordionLog;