import React from 'react';
import type { MenuItem } from '../../types';
import { formatINR } from '../../lib/formatters';

interface SizePickerProps {
  sizes: MenuItem[];
  selectedSize: MenuItem | null;
  onSelect: (size: MenuItem) => void;
}

export const SizePicker: React.FC<SizePickerProps> = ({ sizes, selectedSize, onSelect }) => {
  return (
    <div className="fc-picker-group">
      <div className="fc-section-heading">
        <span className="fc-step-num">1</span>
        <span className="fc-section-title">BOWL SIZE</span>
        <span className="fc-section-badge">Required</span>
      </div>

      <div className="fc-sizes-grid">
        {sizes.map((size) => {
          const isSelected = selectedSize?.id === size.id;
          return (
            <button
              key={size.id}
              type="button"
              className={`fc-size-tile ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(size)}
            >
              <div className="fc-size-code-badge">{size.short_code}</div>
              <div className="fc-size-name">{size.name}</div>
              <div className="fc-size-price">{formatINR(size.price)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
