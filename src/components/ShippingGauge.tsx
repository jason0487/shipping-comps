import React from 'react';

interface ShippingGaugeProps {
  threshold: number;
  previousThreshold?: number;
  competitorCount?: number;
  maxValue?: number;
  width?: number;
  height?: number;
}

export default function ShippingGauge({ 
  threshold, 
  previousThreshold = threshold - 5,
  competitorCount = 5,
  maxValue = 200, 
  width = 280, 
  height = 160 
}: ShippingGaugeProps) {
  const percentage = Math.min(100, (threshold / maxValue) * 100);
  const rotation = (percentage / 100) * 180 - 90;
  
  // Calculate trend
  const trendChange = threshold - previousThreshold;
  const trendText = trendChange > 0 ? 'rose by' : trendChange < 0 ? 'decreased by' : 'remained at';
  const trendAmount = Math.abs(trendChange);
  
  // Calculate center and radius based on dimensions
  const centerX = width / 2;
  const centerY = height - 30;
  const radius = Math.min(width, height) * 0.32;
  
  // Calculate path coordinates for the gauge arcs
  const startAngle = 180;
  const endAngle = 0;
  const greenEndAngle = 135; // 25% of 180 degrees
  const yellowEndAngle = 90;  // 50% of 180 degrees
  
  const polarToCartesian = (angle: number, r: number) => {
    const angleInRadians = (angle - 90) * Math.PI / 180;
    return {
      x: centerX + (r * Math.cos(angleInRadians)),
      y: centerY + (r * Math.sin(angleInRadians))
    };
  };

  const greenStart = polarToCartesian(startAngle, radius);
  const greenEnd = polarToCartesian(greenEndAngle, radius);
  const yellowEnd = polarToCartesian(yellowEndAngle, radius);
  const redEnd = polarToCartesian(endAngle, radius);

  const needleEnd = polarToCartesian(rotation + 90, radius * 0.8);

  return (
    <div className="bg-gray-50 rounded-lg p-8">
      {/* Top row - Market insight text */}
      <div className="mb-8 pr-32">
        <p className="text-3xl text-gray-400 leading-tight font-medium">
          The market average free shipping threshold{' '}
          <span className="text-gray-900 font-semibold">{trendText} ${trendAmount.toFixed(2)}</span>{' '}
          in the past two weeks.
        </p>
      </div>
      
      {/* Bottom row - 2 columns (50/50 split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left - Large threshold number */}
        <div className="pr-8">
          <div className="text-6xl font-bold text-gray-900 mb-2 leading-none">
            ${threshold}
          </div>
          <p className="text-gray-600 text-base">
            Average threshold across {competitorCount} key competitors
          </p>
        </div>
        
        {/* Right - Gauge */}
        <div className="flex justify-center lg:justify-end">
          <svg width={width} height={height} className="mb-2">
            {/* Background gauge */}
            <path
              d={`M ${greenStart.x} ${greenStart.y} A ${radius} ${radius} 0 0 1 ${redEnd.x} ${redEnd.y}`}
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Green section (0-25% = $0-50) */}
            <path
              d={`M ${greenStart.x} ${greenStart.y} A ${radius} ${radius} 0 0 1 ${greenEnd.x} ${greenEnd.y}`}
              stroke="#10b981"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Yellow section (25-50% = $50-100) */}
            <path
              d={`M ${greenEnd.x} ${greenEnd.y} A ${radius} ${radius} 0 0 1 ${yellowEnd.x} ${yellowEnd.y}`}
              stroke="#f59e0b"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Red section (50-100% = $100+) */}
            <path
              d={`M ${yellowEnd.x} ${yellowEnd.y} A ${radius} ${radius} 0 0 1 ${redEnd.x} ${redEnd.y}`}
              stroke="#ef4444"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Needle */}
            <line
              x1={centerX}
              y1={centerY}
              x2={needleEnd.x}
              y2={needleEnd.y}
              stroke="#1f2937"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Center circle */}
            <circle cx={centerX} cy={centerY} r="6" fill="#1f2937" />
            
            {/* Labels */}
            <text
              x={greenStart.x}
              y={centerY + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              $0
            </text>
            <text
              x={centerX}
              y={35}
              textAnchor="middle"
              className="text-xs fill-gray-500"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              $100
            </text>
            <text
              x={redEnd.x}
              y={centerY + 20}
              textAnchor="middle"
              className="text-xs fill-gray-500"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              $200+
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}