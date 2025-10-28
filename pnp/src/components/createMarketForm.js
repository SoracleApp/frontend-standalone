/* global BigInt */

import React, { useState, useEffect, useRef } from 'react';
import './CreateMarketForm.css';
import { useNavigate } from 'react-router-dom';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract, useConnect, useWalletClient } from 'wagmi';
import { PNP_FACTORY_ADDRESS, PNP_ABI, USDPNP_ADDRESS, ETH_SEPOLIA_CHAIN_ID } from '../contracts/contractConfig';
import { parseUnits, formatUnits } from 'viem';
import { WagmiConfig, createConfig, mainnet } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { injected } from 'wagmi/connectors';
import QuestionGuidelinesPopup from './QuestionGuidelinesPopup';

const USDPNP_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CreateMarketForm = ({ onClose }) => {
  const { address, isConnected, chainId: connectedChainId } = useAccount();
  const { connect } = useConnect({ connector: injected() });
  const [question, setQuestion] = useState('');
  const [endTime, setEndTime] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [deadlineValue, setDeadlineValue] = useState('');
  const [deadlineUnit, setDeadlineUnit] = useState('minutes');
  const [isApprovedForCurrentAmount, setIsApprovedForCurrentAmount] = useState(false);
  const [isPollingAllowance, setIsPollingAllowance] = useState(false);
  const [showApproveSuccessMessage, setShowApproveSuccessMessage] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [marketCreationSuccessDetails, setMarketCreationSuccessDetails] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(1000);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();
  const countdownIntervalRef = useRef(null);

  const MINIMUM_COLLATERAL = 2;

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const { data: balanceData } = useReadContract({
    address: USDPNP_ADDRESS,
    abi: USDPNP_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  useEffect(() => {
    if (balanceData !== undefined) setUserBalance(formatUnits(balanceData, 6));
  }, [balanceData]);

  const isCollateralAmountValid = collateralAmount && !isNaN(parseFloat(collateralAmount)) && parseFloat(collateralAmount) >= MINIMUM_COLLATERAL;

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDPNP_ADDRESS,
    abi: [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'allowance',
    args: [address, PNP_FACTORY_ADDRESS],
    query: {
      enabled: !!address && !!collateralAmount && parseFloat(collateralAmount) > 0,
      refetchInterval: isPollingAllowance ? 2000 : false
    }
  });

  useEffect(() => {
    if (isCollateralAmountValid && currentAllowance !== undefined) {
      const requiredAmountUnits = parseUnits(collateralAmount, 6);
      const approved = requiredAmountUnits <= currentAllowance;
      setIsApprovedForCurrentAmount(approved);
      if (approved) {
        setIsPollingAllowance(false);
      }
    } else {
      setIsApprovedForCurrentAmount(false);
    }
  }, [collateralAmount, currentAllowance, isCollateralAmountValid]);

  const { data: marketTxHash, error: marketWriteError, isPending: isCreatingMarket, writeContractAsync: createMarketAsync } = useWriteContract();
  const { data: approveTxHash, error: approveWriteError, isPending: isApproving, writeContractAsync: approveAsync } = useWriteContract();
  
  const { isLoading: isMarketTxProcessing, isSuccess: isMarketTxSuccess, error: marketTxReceiptError, data: marketReceipt } = useWaitForTransactionReceipt({ hash: marketTxHash });
  const { isLoading: isApproveTxProcessing, isSuccess: isApproveTxSuccess, error: approveTxReceiptError } = useWaitForTransactionReceipt({ hash: approveTxHash });

  useEffect(() => {
    if (approveTxHash) setIsPollingAllowance(true);
  }, [approveTxHash]);

  useEffect(() => {
    if (approveWriteError || approveTxReceiptError) setIsPollingAllowance(false);
  }, [approveWriteError, approveTxReceiptError]);
  
  useEffect(() => {
    if (isApproveTxSuccess) {
      refetchAllowance();
      setShowApproveSuccessMessage(true);
      const timer = setTimeout(() => setShowApproveSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isApproveTxSuccess, refetchAllowance]);

  useEffect(() => {
    if (isMarketTxSuccess && marketReceipt && marketTxHash) {
      console.log("Market creation tx successful. Receipt:", marketReceipt);
      setMarketCreationSuccessDetails({ question, collateral: collateralAmount, txHash: marketTxHash });
      setRedirectCountdown(5);

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      countdownIntervalRef.current = setInterval(() => {
        setRedirectCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            if (address) {
              console.log(`Redirecting to /gandalf/user/${address}`);
              navigate(`/gandalf/user/${address}`);
              if (onClose) onClose();
            } else {
              console.error("User address not available for redirect after countdown.");
              if(onClose) onClose();
            }
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
    return () => {
        if(countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null;
        }
    };
  }, [isMarketTxSuccess, marketReceipt, marketTxHash, question, collateralAmount, address, navigate, onClose]);

  const handleCollateralChange = (e) => {
    setCollateralAmount(e.target.value);
    setIsPollingAllowance(false);
  };
  
  const getDeadlineInSeconds = () => {
    if (!deadlineValue || isNaN(parseInt(deadlineValue))) return 0;
    const now = Math.floor(Date.now() / 1000);
    const duration = parseInt(deadlineValue);
    if (deadlineUnit === 'minutes') return now + duration * 60;
    if (deadlineUnit === 'days') return now + duration * 24 * 60 * 60;
    if (deadlineUnit === 'months') return now + duration * 30 * 24 * 60 * 60;
    return 0;
  };

  const isDeadlineValid = () => {
    if (!deadlineValue || isNaN(parseInt(deadlineValue))) return false;
    const duration = parseInt(deadlineValue);
    // Any positive duration is valid
    return duration > 0;
  };

  const handleApprove = async () => {
    if (!address) { alert('Please connect wallet.'); return; }
    if (connectedChainId !== ETH_SEPOLIA_CHAIN_ID) { alert(`Switch to Ethereum Sepolia (ID: ${ETH_SEPOLIA_CHAIN_ID}).`); return; }
    if (!isCollateralAmountValid) { alert(`Enter valid initial liquidity (min ${MINIMUM_COLLATERAL} USDTest).`); return; }
    try {
      const amount = parseUnits(collateralAmount, 6);
      await approveAsync({
        address: USDPNP_ADDRESS,
        abi: [
          {
            "inputs": [
              {"internalType": "address", "name": "spender", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "approve",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'approve',
        args: [PNP_FACTORY_ADDRESS, amount],
        chainId: ETH_SEPOLIA_CHAIN_ID
      });
    } catch (err) { console.error("Error approving USDPNP:", err); alert(`Approval failed: ${(err.shortMessage || err.message).substring(0,100)}`); }
  };

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    if (!question || !collateralAmount || !deadlineValue) { alert('Please fill all required fields.'); return; }
    if (!address) { alert('Please connect your wallet.'); return; }
    if (connectedChainId !== ETH_SEPOLIA_CHAIN_ID) { alert(`Please switch to Ethereum Sepolia network.`); return; }
    if (!isApprovedForCurrentAmount) { alert('The entered initial liquidity amount is not approved. Please approve it first.'); return; }
    if (!isCollateralAmountValid) { alert(`Please enter a valid initial liquidity amount (minimum ${MINIMUM_COLLATERAL} USDTest).`); return; }
    if (!isDeadlineValid()) { alert('Please enter a valid deadline.'); return; }

    let parsedCollateralAmountBn;
    try { parsedCollateralAmountBn = parseUnits(collateralAmount, 6); }
    catch (error) { console.error("Invalid initial liquidity:", error); alert("Invalid initial liquidity amount. Please enter a valid number."); return; }

    const deadlineInSeconds = getDeadlineInSeconds();
    if (deadlineInSeconds <= Math.floor(Date.now() / 1000)) { alert("Deadline must be in the future."); return; }

    try {
      console.log("Creating market with:", {
        question,
        collateralToken: USDPNP_ADDRESS,
        liquidityAmount: parsedCollateralAmountBn.toString(),
        deadline: deadlineInSeconds
      });

      await createMarketAsync({
        address: PNP_FACTORY_ADDRESS,
        abi: PNP_ABI,
        functionName: 'createPredictionMarket',
        args: [
          parsedCollateralAmountBn,
          USDPNP_ADDRESS,
          question,      
          BigInt(deadlineInSeconds)
        ],
        chainId: ETH_SEPOLIA_CHAIN_ID
      });
    } catch (error) {
      console.error("Error creating market:", error);
      alert(`Failed to create market: ${(error.shortMessage || error.message).substring(0,100)}`);
    }
  };

  if (marketCreationSuccessDetails) {
    return (
      <div className="market-success-screen">
        <h2 className="success-title">Market Created Successfully! 🎉</h2>
        <p className="success-question">"{marketCreationSuccessDetails.question}"</p>
        <p className="success-liquidity">
          Initial Liquidity: <span className="success-amount">{marketCreationSuccessDetails.collateral} USDC</span>
        </p>

        <div className="success-transaction">
          <p>Transaction Hash:</p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${marketCreationSuccessDetails.txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="success-tx-link"
          >
            {marketCreationSuccessDetails.txHash}
          </a>
        </div>

        <p className="redirect-countdown-message">
          Redirecting to your markets in 
          <span className="countdown-seconds"> {redirectCountdown} </span>
          seconds...
        </p>

        <div className="button-group">
          <button 
            className="go-to-market-button"
            onClick={() => {
              if (address) {
                navigate(`/gandalf/user/${address}`);
                if (onClose) onClose();
              }
            }}
          >
            View Your Markets
          </button>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just created a prediction market: "${marketCreationSuccessDetails.question}" 🚀\nCheck it out on pnp.exchange!`)}&url=https://pnp.exchange`}
            target="_blank"
            rel="noopener noreferrer"
            className="twitter-share-button"
          >
            Share on Twitter
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="form-close-button" onClick={onClose}>×</button>
      <form className="create-market-form" onSubmit={handleCreateMarket}>
        <div className="form-group">
          <div className="label-with-guidelines">
            <label htmlFor="question">Question</label>
            <span 
              className="see-guidelines-link"
              onClick={() => setShowGuidelines(true)}
            >
              See guidelines
            </span>
          </div>
          <div className="question-input-container">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Will ETH price be above $2500 by end of next week?"
              maxLength={200}
              required
            />
          </div>
          {question.length > 180 && (
            <small className="warning-text">Keep it clear and measurable</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="collateral">Initial Liquidity</label>
          <div className="collateral-input-group">
            <input 
              type="number" 
              id="collateral" 
              value={collateralAmount} 
              onChange={handleCollateralChange} 
              placeholder={`Min ${MINIMUM_COLLATERAL} USDC`}
              min={MINIMUM_COLLATERAL}
              step="0.1"
              required 
            />
            <div className="usdc-tag">USDC</div>
          </div>
          {userBalance && (
            <div className="balance-info">
              Balance: {parseFloat(userBalance).toFixed(2)} USDC
              {parseFloat(userBalance) < parseFloat(collateralAmount || '0') && (
                <span className="warning-text">Insufficient balance</span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="deadline">Deadline</label>
          <div className="deadline-input-group">
            <input 
              type="number" 
              id="deadline" 
              value={deadlineValue} 
              onChange={(e) => setDeadlineValue(e.target.value)} 
              placeholder="Duration" 
              min="1"
              required 
            />
            <div className="unit-selector">
              <button 
                type="button" 
                className={`unit-button ${deadlineUnit === 'minutes' ? 'active' : ''}`} 
                onClick={() => setDeadlineUnit('minutes')}
              >
                Minutes
              </button>
              <button 
                type="button" 
                className={`unit-button ${deadlineUnit === 'days' ? 'active' : ''}`} 
                onClick={() => setDeadlineUnit('days')}
              >
                Days
              </button>
              <button 
                type="button" 
                className={`unit-button ${deadlineUnit === 'months' ? 'active' : ''}`} 
                onClick={() => setDeadlineUnit('months')}
              >
                Months
              </button>
            </div>
          </div>
          {deadlineValue && !isDeadlineValid() && (
            <small className="warning-text">Please enter a valid deadline</small>
          )}
        </div>

        {!isApprovedForCurrentAmount && (
          <button 
            type="button"
            onClick={handleApprove}
            className={`approve-button ${!isCollateralAmountValid ? 'disabled' : ''}`}
            disabled={!isCollateralAmountValid || isApproving || isApproveTxProcessing}
          >
            {isApproving || isApproveTxProcessing ? 'Approving...' : 'Approve USDC'}
          </button>
        )}

        {showApproveSuccessMessage && (
          <div className="success-message">USDC approved successfully! You can now create the market.</div>
        )}

        <button 
          type="submit" 
          className="create-button"
          disabled={!isApprovedForCurrentAmount || isCreatingMarket || isMarketTxProcessing || !isDeadlineValid()}
        >
          {isCreatingMarket || isMarketTxProcessing ? 'Creating Market...' : 'Create Market'}
        </button>

        {(marketWriteError || marketTxReceiptError) && (
          <div className="error-message">
            {marketWriteError ? marketWriteError.message.substring(0, 150) : marketTxReceiptError.message.substring(0, 150)}
          </div>
        )}

        {isMarketTxProcessing && (
          <div className="transaction-status">
            Transaction submitted and being processed. Please wait...
          </div>
        )}

        {showGuidelines && (
          <QuestionGuidelinesPopup onClose={() => setShowGuidelines(false)} />
        )}
      </form>
    </>
  );
};

export default CreateMarketForm; 
