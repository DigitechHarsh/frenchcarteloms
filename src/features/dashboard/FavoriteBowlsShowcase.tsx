import React from 'react';
import { Card, Tag, Rate, Tooltip } from 'antd';
import { HeartFilled, FireOutlined } from '@ant-design/icons';
import { formatINR } from '../../lib/formatters';

interface FavoriteBowlsShowcaseProps {
  onSelectBowl?: (flavor: string) => void;
  activeFilter?: string | null;
}

const FAVORITES = [
  {
    id: 'fav-1',
    name: 'Spicy Chipotle Bite',
    size: 'Bite',
    flavor: 'Spicy Chipotle',
    price: 169,
    rating: 4.9,
    reviews: 240,
    likes: '14.2k',
    bgColor: 'linear-gradient(135deg, #FF6B4A 0%, #D4380D 100%)',
    imgEmoji: '🍟🌶️',
  },
  {
    id: 'fav-2',
    name: 'Korean BBQ KiloBite',
    size: 'KiloBite',
    flavor: 'Korean BBQ',
    price: 279,
    rating: 5.0,
    reviews: 310,
    likes: '19.8k',
    bgColor: 'linear-gradient(135deg, #873800 0%, #D46B08 100%)',
    imgEmoji: '🍟🍖',
  },
  {
    id: 'fav-3',
    name: 'Chilly Cheese MegaBite',
    size: 'MegaBite',
    flavor: 'Chilly Cheese',
    price: 329,
    rating: 4.8,
    reviews: 185,
    likes: '11.5k',
    bgColor: 'linear-gradient(135deg, #FA8C16 0%, #FAAD14 100%)',
    imgEmoji: '🍟🧀',
  },
  {
    id: 'fav-4',
    name: 'Cheese Peri Peri GigaBite',
    size: 'GigaBite',
    flavor: 'Cheese Peri Peri',
    price: 389,
    rating: 4.9,
    reviews: 420,
    likes: '22.4k',
    bgColor: 'linear-gradient(135deg, #722ED1 0%, #E65100 100%)',
    imgEmoji: '🍟🔥',
  },
];

export const FavoriteBowlsShowcase: React.FC<FavoriteBowlsShowcaseProps> = ({
  onSelectBowl,
  activeFilter,
}) => {
  return (
    <div className="fc-fav-showcase-section">
      <div className="fc-fav-header">
        <h3 className="fc-fav-title">Favourite French Cartel Bowls</h3>
        <span className="fc-fav-sub">Top ranked by customer repeat orders • Click to filter table</span>
      </div>

      <div className="fc-fav-cards-grid">
        {FAVORITES.map((item) => {
          const isSelected = activeFilter === item.flavor;

          return (
            <div
              key={item.id}
              className={`fc-fav-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectBowl?.(item.flavor)}
            >
              {/* Image banner with gradient & food visual */}
              <div className="fc-fav-img-wrap" style={{ background: item.bgColor }}>
                <span className="fc-fav-emoji-art">{item.imgEmoji}</span>
                <span className="fc-fav-price-badge">{formatINR(item.price)}</span>
              </div>

              {/* Card Body */}
              <div className="fc-fav-body">
                <span className="fc-fav-item-name">{item.name}</span>
                
                <div className="fc-fav-rating-row">
                  <Rate disabled defaultValue={5} style={{ fontSize: 13, color: '#FAAD14' }} />
                  <span className="fc-fav-reviews">({item.reviews} Reviews)</span>
                </div>

                <div className="fc-fav-footer">
                  <Tag color="volcano" style={{ fontWeight: 700, margin: 0 }}>
                    {item.size}
                  </Tag>
                  <span className="fc-fav-likes">
                    <HeartFilled style={{ color: '#EB2F96', marginRight: 4 }} />
                    {item.likes} Like it
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
