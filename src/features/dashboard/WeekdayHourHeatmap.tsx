import React from 'react';
import { Card, Tooltip } from 'antd';

interface HeatmapCell {
  day: string; // 'Mon', 'Tue', etc.
  hour: number; // 12 .. 22
  count: number;
}

interface WeekdayHourHeatmapProps {
  data: HeatmapCell[];
  onSelectCell?: (day: string, hour: number) => void;
  selectedFilter?: string | null;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export const WeekdayHourHeatmap: React.FC<WeekdayHourHeatmapProps> = ({
  data,
  onSelectCell,
  selectedFilter,
}) => {
  // Find max count to normalize heat color
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  const getCellColor = (count: number) => {
    if (count === 0) return 'rgba(230, 81, 0, 0.04)';
    const intensity = Math.min(1, count / maxCount);
    // Orange/Red fire gradient
    if (intensity < 0.25) return 'rgba(250, 140, 22, 0.25)';
    if (intensity < 0.5) return 'rgba(250, 140, 22, 0.5)';
    if (intensity < 0.75) return 'rgba(230, 81, 0, 0.75)';
    return '#E65100'; // Peak
  };

  const formatHourLabel = (h: number) => {
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
  };

  return (
    <Card className="fc-chart-card">
      <div className="fc-chart-header">
        <div>
          <h3 className="fc-chart-title">Weekday × Hour Rush Heatmap</h3>
          <span className="fc-chart-subtitle">
            Busiest times of the week • Darker red indicates peak orders • Click a cell to filter table
          </span>
        </div>
      </div>

      <div className="fc-heatmap-wrapper">
        <div className="fc-heatmap-grid">
          {/* Header row: hours */}
          <div className="fc-heatmap-row header-row">
            <div className="fc-heatmap-day-label" />
            {HOURS.map((h) => (
              <div key={h} className="fc-heatmap-hour-label">
                {formatHourLabel(h)}
              </div>
            ))}
          </div>

          {/* Rows for each day */}
          {DAYS.map((day) => (
            <div key={day} className="fc-heatmap-row">
              <div className="fc-heatmap-day-label">{day}</div>
              {HOURS.map((hour) => {
                const cell = data.find((d) => d.day === day && d.hour === hour);
                const count = cell ? cell.count : 0;
                const cellBg = getCellColor(count);
                const isSelected = selectedFilter === `${day}-${hour}`;

                return (
                  <Tooltip
                    key={`${day}-${hour}`}
                    title={`${day} at ${formatHourLabel(hour)}: ${count} Orders (Click to filter)`}
                  >
                    <div
                      className={`fc-heatmap-cell ${isSelected ? 'selected' : ''}`}
                      style={{ backgroundColor: cellBg }}
                      onClick={() => onSelectCell?.(day, hour)}
                    >
                      {count > 0 && <span className="fc-cell-count">{count}</span>}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="fc-heatmap-legend">
          <span style={{ fontSize: 12, color: '#8C8C8C' }}>Less Busy</span>
          <div className="fc-legend-swatch" style={{ background: 'rgba(230, 81, 0, 0.04)' }} />
          <div className="fc-legend-swatch" style={{ background: 'rgba(250, 140, 22, 0.25)' }} />
          <div className="fc-legend-swatch" style={{ background: 'rgba(250, 140, 22, 0.5)' }} />
          <div className="fc-legend-swatch" style={{ background: 'rgba(230, 81, 0, 0.75)' }} />
          <div className="fc-legend-swatch" style={{ background: '#E65100' }} />
          <span style={{ fontSize: 12, color: '#8C8C8C' }}>High Rush</span>
        </div>
      </div>
    </Card>
  );
};
