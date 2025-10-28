import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { PREDICTION_MARKET_ADDRESS } from '../constants';
import { PREDICTION_MARKET_ABI } from '../contracts/predictionMarket';

const PRICE_CHECKER_ADDRESS = "0x0000000000cDC1F8d393415455E382c30FBc0a84";

const PredictionMarketCard = ({ 
  tokenName, 
  tokenAddress, 
  targetPrice, 
  timeframe, 
  yesMultiplier, 
  noMultiplier,
  conditionId,
  collateralTokenAddress
}) => {
  const navigate = useNavigate();

  const [selectedOption, setSelectedOption] = useState(null);
  const [collateral, setCollateral] = useState('');
  const [volume, setVolume] = useState(0);

  const { data: priceData, error: priceError } = useReadContract({
    address: PRICE_CHECKER_ADDRESS,
    abi: [{
      name: 'checkPrice',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'token', type: 'address' }],
      outputs: [
        { name: 'price', type: 'uint256' },
        { name: 'priceStr', type: 'string' }
      ],
    }],
    functionName: 'checkPrice',
    args: [tokenAddress],
    chainId: 8453, // Base mainnet
  });

  const { data: reserveData } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'marketReserve',
    args: [conditionId],
    chainId: 8453,
  });

  const handleTokenClick = () => {
    navigate(`/price_markets/${tokenAddress}`);
  };

  const formattedReserve = reserveData 
    ? Number(reserveData) / (10 ** 18) // Assuming 18 decimals for USDC
    : 0;

  useEffect(() => {
    setVolume(formattedReserve);
  }, [formattedReserve]);

  return (
    <div className='white-rectangle-container' onClick={handleTokenClick} style={{ cursor: 'pointer' }}>
      <div className='question-section'>
        <h2 className='white-rectangle-title'>
          Will <span style={{ textDecoration: 'underline' }}>${tokenName}</span> reach ${targetPrice.toLocaleString()} by {timeframe} days?
        </h2>
        <div className='info-icon' title="This prediction market settles onchain by fetching price from corresponding UniV3 Pool. Truly permissionless for any asset.">
          ℹ️
        </div>
      </div>

      <div className='price-highlight'>
        Current Price : 
        <span className='price-color'>
          {priceError 
            ? 'Error fetching price' 
            : priceData 
              ? ` $${priceData[1]}` 
              : 'Loading...'}
        </span>
      </div>
      
      <div className='prediction-section'>
        <div className='prediction-controls'>
          <div className='options-section'>
            <button
              className={`prediction-button yes-button ${selectedOption === 'YES' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOption('YES');
              }}
            >
              YES x{yesMultiplier}
            </button>
            <button
              className={`prediction-button no-button ${selectedOption === 'NO' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOption('NO');
              }}
            >
              NO x{noMultiplier}
            </button>
          </div>

          <div className='mint-controls'>
            <input
              type="number"
              placeholder="Collateral Amount"
              value={collateral}
              onChange={(e) => {
                e.stopPropagation();
                setCollateral(e.target.value);
              }}
              className={`collateral-input ${!selectedOption ? 'disabled' : ''}`}
              disabled={!selectedOption}
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className={`mint-button ${!selectedOption ? 'disabled' : ''}`}
              disabled={!selectedOption}
              onClick={(e) => e.stopPropagation()}
            >
              Mint Position
            </button>
          </div>
        </div>
      </div>

      <div className='footer-info'>
        <div className='footer-section'>
          <div className='footer-item'>
            <div className='footer-label'>Market Reserve</div>
            <div className='footer-value reserve-value'>
              ${formattedReserve.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </div>
          <div className='footer-divider'></div>
          <div className='footer-item'>
            <div className='footer-label'>Asset tracked on UNIV3</div>
            <a 
              href={`https://basescan.org/address/${tokenAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className='footer-value address-value'
              onClick={(e) => e.stopPropagation()}
            >
              {`${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`}
              <span className='external-link'>↗</span>
            </a>
          </div>
          <div className='footer-divider'></div>
          <div className='footer-item'>
            <div className='footer-label'>Want to earn fees?</div>
            <button 
              className='provide-liquidity-btn'
              onClick={(e) => {
                e.stopPropagation();
                // Add liquidity logic here
              }}
            >
              Provide Liquidity
              <span className='btn-icon'>+</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .white-rectangle-container {
          background: #1e1e1e;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }

        .prediction-button {
          padding: 0.8rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .yes-button {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid #10b981;
        }

        .yes-button:hover, .yes-button.selected {
          background: rgba(16, 185, 129, 0.2);
        }

        .no-button {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid #ef4444;
        }

        .no-button:hover, .no-button.selected {
          background: rgba(239, 68, 68, 0.2);
        }

        .mint-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .collateral-input {
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid #333;
          background: #2d2d2d;
          color: white;
        }

        .mint-button {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          border: none;
          background: #3b82f6;
          color: white;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .mint-button:hover:not(.disabled) {
          background: #2563eb;
        }

        .mint-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .options-section {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .price-highlight {
          text-align: center;
          margin: 1rem 0;
          font-size: 1.2rem;
        }

        .price-color {
          color: #10b981;
          font-weight: 600;
        }

        .footer-info {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-section {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 2rem;
        }

        .footer-item {
          flex: 1;
          text-align: center;
        }

        .footer-divider {
          width: 1px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
        }

        .footer-label {
          font-size: 0.9rem;
          color: #888;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer-value {
          font-size: 1.1rem;
          color: #fff;
          font-weight: 500;
        }

        .reserve-value {
          color: #10b981;
          font-family: 'Orbitron', sans-serif;
        }

        .address-value {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .address-value:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .external-link {
          font-size: 0.9rem;
          opacity: 0.7;
        }

        .provide-liquidity-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.2);
        }

        .provide-liquidity-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .btn-icon {
          font-size: 1.2rem;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default PredictionMarketCard;
