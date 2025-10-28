import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { usePrepareContractWrite, useContractWrite, useWaitForTransactionReceipt, useAccount, useConnect, useNetwork } from 'wagmi';
import { ethers } from 'ethers';
import { PNP_FACTORY_ADDRESS, PNP_ABI, USDPNP_ADDRESS, ETH_SEPOLIA_CHAIN_ID } from '../contracts/contractConfig';
import { injected } from 'wagmi/connectors';

const {config, error: prepareError} = usePrepareContractWrite({
  address: PNP_FACTORY_ADDRESS,
  abi: PNP_ABI,
  functionName: 'createPredictionMarket',
  args: [
  ]
}); 
