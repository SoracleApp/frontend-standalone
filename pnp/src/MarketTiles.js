import React, { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { PNP_FACTORY_ADDRESS, PNP_ABI } from '../contracts/contractConfig';
import { formatEther } from 'viem';
import './MarketTiles.css';

const MarketTiles = () => {
  const [markets, setMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  // Fetch all markets
  const fetchMarkets = async () => {
    try {
      console.log("=== Fetching All Markets ===");
      
      // Get all PNP_MarketCreated events
      const events = await publicClient.getLogs({
        address: PNP_FACTORY_ADDRESS,
        event: {
          type: 'event',
          name: 'PNP_MarketCreated',
          inputs: [
            { indexed: true, name: 'conditionId', type: 'bytes32' },
            { indexed: true, name: 'marketCreator', type: 'address' }
          ]
        },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      console.log("Found markets:", events);

      // Fetch details for each market
      const marketDetails = await Promise.all(
        events.map(async (event) => {
          const conditionId = event.args.conditionId;
          
          // Fetch market details
          const [question, endTime, reserve] = await Promise.all([
            publicClient.readContract({
              address: PNP_FACTORY_ADDRESS,
              abi: PNP_ABI,
              functionName: 'marketQuestion',
              args: [conditionId]
            }),
            publicClient.readContract({
              address: PNP_FACTORY_ADDRESS,
              abi: PNP_ABI,
              functionName: 'getMarketEndTime',
              args: [conditionId]
            }),
            publicClient.readContract({
              address: PNP_FACTORY_ADDRESS,
              abi: PNP_ABI,
              functionName: 'marketReserve',
              args: [conditionId]
            })
          ]);

          return {
            id: conditionId,
            question,
            endTime: Number(endTime),
            reserve: formatEther(reserve),
            creator: event.args.marketCreator
          };
        })
      );

      console.log("Market details:", marketDetails);
      setMarkets(marketDetails);
    } catch (error) {
      console.error("Error fetching markets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  if (isLoading) {
    return <div className="market-tiles-loading">Loading markets...</div>;
  }

  return (
    <div className="market-tiles-container">
      {markets.map((market) => (
        <div key={market.id} className="market-tile">
          <h3 className="market-question">{market.question}</h3>
          <div className="market-details">
            <div className="market-reserve">
              Reserve: ${Number(market.reserve).toFixed(2)}
            </div>
            <div className="market-deadline">
              Ends: {new Date(market.endTime * 1000).toLocaleString()}
            </div>
            <div className="market-creator">
              Created by: {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
            </div>
          </div>
          <a href={`/gandalf/${market.id}/trade`} className="trade-link">
            Trade Now
          </a>
        </div>
      ))}
    </div>
  );
};

export default MarketTiles; 
