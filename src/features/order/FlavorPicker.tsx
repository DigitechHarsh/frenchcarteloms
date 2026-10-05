import React from 'react';
import type { MenuItem } from '../../types';

interface FlavorPickerProps {
  flavors: MenuItem[];
  selectedFlavor: MenuItem | null;
  onSelect: (flavor: MenuItem) => void;
}

const flavorColors: Record<string, { bg: string; border: string; text: string }> = {
  'Spicy Chipotle': { bg: 'rgba(212, 56, 13, 0.12)', border: '#D4380D', text: '#D4380D' },
  'Chilly Cheese': { bg: 'rgba(250, 140, 22, 0.12)', border: '#FA8C16', text: '#D46B08' },
  'Cheese Peri Peri': { bg: 'rgba(250, 173, 20, 0.15)', border: '#FAAD14', text: '#D48806' },
  'Korean BBQ': { bg: 'rgba(135, 56, 0, 0.12)', border: '#873800', text: '#873800' },
};

export const FlavorPicker: React.FC<FlavorPickerProps> = ({ flavors, selectedFlavor, onSelect }) => {
  return (
    <div className="fc-picker-group">
      <div className="fc-section-heading">
        <span className="fc-step-num">2</span>
        <span className="fc-section-title">FLAVOR DUST</span>
        <span className="fc-section-badge">Free • Choose 1</span>
      </div>

      <div className="fc-flavors-grid">
        {flavors.map((flavor) => {
          const isSelected = selectedFlavor?.id === flavor.id;
          const theme = flavorColors[flavor.name] || {
            bg: 'rgba(230, 81, 0, 0.12)',
            border: '#E65100',
            text: '#E65100',
          };

          return (
            <button
              key={flavor.id}
              type="button"
              className={`fc-flavor-tile ${isSelected ? 'selected' : ''}`}
              style={{
                borderColor: isSelected ? theme.border : undefined,
                background: isSelected ? theme.bg : undefined,
              }}
              onClick={() => onSelect(flavor)}
            >
              <div 
                className="fc-flavor-indicator" 
                style={{ backgroundColor: theme.border }} 
              />
              <span className="fc-flavor-name" style={{ color: isSelected ? theme.text : undefined }}>
                {flavor.name}
              </span>
              <span className="fc-flavor-free">FREE</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
