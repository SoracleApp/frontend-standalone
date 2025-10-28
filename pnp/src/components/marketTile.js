import React from 'react';
import './MarketTile.css';

const MarketTile = ({ 
  question, 
  yesPrice, 
  noPrice, 
  yesMultiplier,
  noMultiplier,
  onClick
}) => {
  return (
    <div className="market-tile" onClick={onClick}>
      <div className="tile-content">
        <h3 className="tile-question">{question}</h3>
        <div className="tile-outcomes">
          <div className="outcome yes">
            <div className="outcome-header">YES</div>
            <div className="outcome-data">
              <div className="outcome-price">${Number(yesPrice).toFixed(2)}</div>
              <div className="outcome-multiplier">×{Number(yesMultiplier).toFixed(2)}</div>
            </div>
          </div>
          <div className="outcome no">
            <div className="outcome-header">NO</div>
            <div className="outcome-data">
              <div className="outcome-price">${Number(noPrice).toFixed(2)}</div>
              <div className="outcome-multiplier">×{Number(noMultiplier).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTile;
