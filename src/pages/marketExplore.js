import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContractRead, useAccount } from 'wagmi';
import { PNP_FACTORY_ADDRESS, PNP_ABI } from '../contracts/contractConfig';
import { formatEther, parseEther } from 'viem';

const MarketExplore = () => {
  const { conditionId } = useParams();

  const { data: question } = useContractRead({
    address: PNP_FACTORY_ADDRESS,
    abi: PNP_ABI,
    functionName: 'marketQuestion',
    args: [conditionId],
    watch: true,
  });

  const { data: endTime } = useContractRead({
    address: PNP_FACTORY_ADDRESS,
    abi: PNP_ABI,
    functionName: 'getMarketEndTime',
    args: [conditionId],
    watch: true,
  });

  const { data: yesTokenId } = useContractRead({
    address: PNP_FACTORY_ADDRESS,
    abi: PNP_ABI,
    functionName: 'getYesTokenId',
    args: [conditionId],
    watch: true,
  });

  const { data: noTokenId } = useContractRead({
    address: PNP_FACTORY_ADDRESS,
    abi: PNP_ABI,
    functionName: 'getNoTokenId',
    args: [conditionId],
    watch: true,
  });

  const { data: marketReserve } = useContractRead({
    address: PNP_FACTORY_ADDRESS,
    abi: PNP_ABI,
    functionName: 'marketReserve',
    args: [conditionId],
    watch: true,
  });

  const { data: collateralToken } = useContractRead({
    address: PNP_FACTORY_ADDRESS,
    abi: PNP_ABI,
    functionName: 'collateralToken',
    args: [conditionId],
    watch: true,
  });

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default MarketExplore; 
