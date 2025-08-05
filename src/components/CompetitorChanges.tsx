import React, { useState } from 'react';

interface CompetitorChange {
  name: string;
  currentThreshold: number;
  previousThreshold: number;
  change: 'up' | 'down' | 'none';
}

interface CompetitorChangesProps {
  changes?: CompetitorChange[];
}

// Function to get company logo URL
const getCompanyLogo = (companyName: string): string => {
  const domain = companyName.toLowerCase()
    .replace(/\s+/g, '')
    .replace('collective', 'collection');
  
  // Use Clearbit Logo API for high-quality company logos
  return `https://logo.clearbit.com/${domain}.com`;
};

export default function CompetitorChanges({ changes }: CompetitorChangesProps) {
  // Mock data for demonstration - in production this would come from actual data
  const mockChanges: CompetitorChange[] = [
    { name: "Lululemon", currentThreshold: 99, previousThreshold: 150, change: "down" },
    { name: "Alo Yoga", currentThreshold: 75, previousThreshold: 75, change: "none" },
    { name: "Outdoor Voices", currentThreshold: 50, previousThreshold: 35, change: "up" },
    { name: "Girlfriend Collective", currentThreshold: 0, previousThreshold: 25, change: "down" },
    { name: "Everlane", currentThreshold: 100, previousThreshold: 100, change: "none" }
  ];

  const competitorChanges = changes || mockChanges;
  const [brokenLogos, setBrokenLogos] = useState<Set<number>>(new Set());

  const getArrowIcon = (change: string) => {
    switch (change) {
      case 'down':
        return '↓';
      case 'up':
        return '↑';
      default:
        return '→';
    }
  };

  const getArrowColor = (change: string) => {
    switch (change) {
      case 'down':
        return 'text-green-500';
      case 'up':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getBorderColor = (change: string) => {
    switch (change) {
      case 'down':
        return 'border-green-500';
      case 'up':
        return 'border-red-500';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        📊 Recent Threshold Changes
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {competitorChanges.map((competitor, index) => {
          const changeText = competitor.change === 'none' ? 'No change' : 
            `$${competitor.previousThreshold} → $${competitor.currentThreshold}`;
          
          return (
            <div 
              key={index}
              className={`bg-gray-50 rounded-lg p-5 border-l-4 ${getBorderColor(competitor.change)}`}
            >
              {/* Company Header with Logo */}
              <div className="flex items-center mb-3">
                {!brokenLogos.has(index) && (
                  <img 
                    src={getCompanyLogo(competitor.name)}
                    alt={`${competitor.name} logo`}
                    className="w-6 h-6 rounded border border-gray-200 bg-white mr-2"
                    onError={() => {
                      setBrokenLogos(prev => new Set(prev).add(index));
                    }}
                  />
                )}
                <div className="font-semibold text-gray-900 text-sm leading-tight">
                  {competitor.name}
                </div>
              </div>
              
              {/* Prominent Dollar Amount */}
              <div className="flex items-baseline mb-2">
                <span className="text-3xl font-bold text-gray-900 mr-2">
                  ${competitor.currentThreshold}
                </span>
                <span className={`text-lg font-semibold ${getArrowColor(competitor.change)}`}>
                  {getArrowIcon(competitor.change)}
                </span>
              </div>
              
              {/* Change Details */}
              <div className="text-xs text-gray-500 font-medium">
                {changeText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}