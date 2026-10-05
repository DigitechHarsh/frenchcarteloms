import React from 'react';
import { Tag } from 'antd';
import type { MenuItem, FreeToppingChoice } from '../../types';
import { formatINR } from '../../lib/formatters';
import { CheckOutlined } from '@ant-design/icons';

interface ToppingsPickerProps {
  paidToppings: MenuItem[];
  selectedToppings: MenuItem[];
  onToggleTopping: (topping: MenuItem) => void;
  selectedFreeTopping: FreeToppingChoice;
  onSelectFreeTopping: (choice: FreeToppingChoice) => void;
}

export const ToppingsPicker: React.FC<ToppingsPickerProps> = ({
  paidToppings,
  selectedToppings,
  onToggleTopping,
  selectedFreeTopping,
  onSelectFreeTopping,
}) => {
  return (
    <div className="fc-picker-group">
      {/* 1. Paid Toppings Section */}
      <div className="fc-section-heading">
        <span className="fc-step-num">3</span>
        <span className="fc-section-title">PAID TOPPINGS</span>
        <span className="fc-section-badge optional">Multi-select</span>
      </div>

      <div className="fc-toppings-chips">
        {paidToppings.map((top) => {
          const isSelected = selectedToppings.some((t) => t.id === top.id);
          return (
            <button
              key={top.id}
              type="button"
              className={`fc-topping-chip ${isSelected ? 'active' : ''}`}
              onClick={() => onToggleTopping(top)}
            >
              <div className="fc-chip-check">
                {isSelected && <CheckOutlined style={{ fontSize: 13 }} />}
              </div>
              <span className="fc-chip-name">{top.name}</span>
              <span className="fc-chip-price">+{formatINR(top.price)}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Free Topping Section (Strict Single Choice: Jalapeno / Olives / None) */}
      <div className="fc-section-heading" style={{ marginTop: 22 }}>
        <span className="fc-step-num">4</span>
        <span className="fc-section-title">FREE FRESH TOPPING</span>
        <Tag color="cyan" style={{ marginLeft: 8, fontWeight: 600 }}>
          Choose 1 Only • Rs 0
        </Tag>
      </div>

      <div className="fc-free-topping-radio-grid">
        {(['Jalapeno', 'Olives', 'None'] as FreeToppingChoice[]).map((choice) => {
          const isSelected = selectedFreeTopping === choice;
          return (
            <label
              key={choice}
              className={`fc-free-radio-tile ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectFreeTopping(choice)}
            >
              <div className="fc-radio-circle">
                {isSelected && <div className="fc-radio-inner-dot" />}
              </div>
              <div className="fc-free-radio-info">
                <span className="fc-free-name">
                  {choice === 'Jalapeno' && '🌶️ '}
                  {choice === 'Olives' && '🫒 '}
                  {choice === 'None' && '🚫 '}
                  {choice}
                </span>
                <span className="fc-free-cost">Rs 0</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
