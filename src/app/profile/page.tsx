'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import EditSubscriptionModal from '@/components/EditSubscriptionModal';
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal';

interface AnalysisRecord {
  id: string;
  website_url: string;
  analysis_type: string;
  competitor_count: number;
  status: 'completed' | 'failed' | 'processing';
  pdf_url: string | null;
  business_analysis: string | null;
  competitors_data: any | null;
  report_html: string | null;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  website_url: string;
  subscription_type: string;
  is_active: boolean;
  price_monthly: number;
  stripe_subscription_id: string;
  next_report_date: string;
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paymentType: string;
  tokensPurchased: number;
  status: string;
  date: string;
  cardLast4: string;
  paymentMethod: string;
  cardBrand: string;
}

export default function Profile() {
  const { user, signOut, isAuthenticated, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState<Subscription | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const recordsPerPage = 10;
  const [userStats, setUserStats] = useState({
    analysesCompleted: 0,
    tokensRemaining: 0,
    activeSubscriptions: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Cleanup stuck analyses and load data
  const cleanupStuckAnalyses = async () => {
    try {
      await fetch('/api/cleanup-stuck-analyses', { method: 'POST' });
    } catch (error) {
      console.error('Failed to cleanup stuck analyses:', error);
    }
  };

  // Load analysis history, subscriptions, user stats, and payment history on component mount
  useEffect(() => {
    if (user?.id) {
      // Clean up any stuck analyses first, then load data
      cleanupStuckAnalyses().then(() => {
        loadAnalysisHistory();
        loadSubscriptions();
        loadUserStats();
        loadPaymentHistory();
      });
    }
  }, [user?.id]);

  // Reload analysis history when page changes
  useEffect(() => {
    if (user?.id) {
      loadAnalysisHistory();
    }
  }, [currentPage, user?.id]);

  const loadAnalysisHistory = async () => {
    if (!user?.id) return;
    
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/analysis-history?userId=${user.id}&page=${currentPage}&limit=${recordsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data.history || []);
        setTotalRecords(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user?.id) return;
    
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/user-stats?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          analysesCompleted: data.analysesCompleted || 0,
          tokensRemaining: data.tokensRemaining || 0,
          activeSubscriptions: data.activeSubscriptions || 0
        });
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadPaymentHistory = async () => {
    if (!user?.id) return;
    
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/payment-history?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const loadSubscriptions = async () => {
    if (!user?.id) return;
    
    setSubscriptionsLoading(true);
    try {
      const response = await fetch(`/api/subscriptions?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
  };

  const handleSaveSubscription = async (updatedData: Partial<Subscription>) => {
    if (!editingSubscription) return;

    try {
      // Here you would make API call to update subscription
      const response = await fetch(`/api/subscriptions/${editingSubscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        // Update local state
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === editingSubscription.id 
              ? { ...sub, ...updatedData } 
              : sub
          )
        );
        setMessage('Subscription updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setMessage('Failed to update subscription. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCancelSubscription = (subscription: Subscription) => {
    setCancellingSubscription(subscription);
  };

  const handleConfirmCancelSubscription = async (subscriptionId: string) => {
    try {
      // Cancel subscription via API which will handle Stripe cancellation
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state to mark subscription as cancelled
        setSubscriptions(prev => 
          prev.map(sub => 
            sub.id === subscriptionId 
              ? { ...sub, is_active: false } 
              : sub
          )
        );
        setMessage('Subscription cancelled successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setMessage('Failed to cancel subscription. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete subscription from database
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove subscription from local state
        setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
        setMessage('Subscription deleted successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to delete subscription');
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      setMessage('Failed to delete subscription. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const viewReport = async (record: AnalysisRecord) => {
    if (!record.business_analysis || !record.competitors_data) {
      setMessage('Cannot view report: Analysis data incomplete');
      return;
    }

    setGeneratingPdf(record.id);
    try {
      console.log('Viewing report for:', record.website_url);
      
      // Use stored HTML report if available (matches homepage exactly)
      let htmlContent = record.report_html;
      
      // If no stored HTML, generate it using the same method as homepage
      if (!htmlContent) {
        console.log('No stored HTML found, generating report...');
        htmlContent = createHomepageMatchingHTML(record.website_url, record.business_analysis, record.competitors_data);
      }
      
      // Open HTML report in new tab (same as homepage)
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        setMessage('Report opened in new tab!');
      } else {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setMessage('Failed to generate report. Please try again.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createHomepageMatchingHTML = (websiteUrl: string, businessAnalysis: string, competitors: any) => {
    // Create the EXACT same HTML structure as the homepage CompetitorResults component
    const competitorsArray = Array.isArray(competitors) ? competitors : 
                             (competitors?.competitors ? competitors.competitors : []);
    
    // Helper functions matching the homepage component
    const extractThreshold = (competitor: any): number | null => {
      if (competitor.threshold !== undefined && competitor.threshold !== null) {
        return competitor.threshold;
      }
      
      // Fallback: extract from shipping text
      const shippingText = competitor.shipping_incentives || competitor.shippingAnalysis || '';
      if (!shippingText) return null;
      
      const matches = shippingText.match(/\$(\d+(?:\.\d{2})?)/g);
      if (matches && matches.length > 0) {
        const amounts = matches.map((match: string) => parseFloat(match.replace('$', '')));
        return Math.min(...amounts);
      }
      return null;
    };
    
    const getThresholdPosition = (threshold: number | null): number => {
      if (!threshold) return 0;
      return Math.min((threshold / 200) * 100, 100);
    };
    
    const getThresholdColor = (threshold: number | null): string => {
      if (!threshold) return 'bg-gray-400';
      if (threshold === 0) return 'bg-green-500';
      if (threshold <= 50) return 'bg-yellow-500';
      if (threshold <= 100) return 'bg-orange-500';
      return 'bg-red-500';
    };
    
    const formatShippingIncentives = (incentives: string): string[] => {
      if (!incentives) return ['No shipping information available'];
      
      return incentives.split('\n')
        .filter(line => line.trim())
        .map(line => line.trim())
        .slice(0, 5);
    };

    // Extract brand name from URL
    const extractBrandName = (url: string) => {
      try {
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const domain = cleanUrl.split('/')[0];
        const brandName = domain.split('.')[0];
        return brandName.charAt(0).toUpperCase() + brandName.slice(1);
      } catch {
        return 'Brand';
      }
    };

    const brandName = extractBrandName(websiteUrl);
    const logoUrl = `https://logo.clearbit.com/${websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}`;
    
    // Generate competitor cards exactly like homepage
    const competitorCardsHTML = competitorsArray.map((competitor: any) => {
      const threshold = extractThreshold(competitor);
      const incentiveLines = formatShippingIncentives(competitor.shipping_incentives || competitor.shippingAnalysis || '');
      
      return `
        <div class="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div class="flex items-center mb-4">
            <img 
              src="https://logo.clearbit.com/${competitor.website?.replace(/^https?:\/\//, '').replace(/^www\./, '') || 'placeholder.com'}"
              alt="${competitor.name} logo"
              class="w-8 h-8 mr-3 object-contain"
              onerror="this.style.display='none'"
            />
            <div>
              <h3 class="font-bold text-lg text-gray-900">${competitor.name}</h3>
              <a 
                href="${competitor.website?.startsWith('http') ? competitor.website : `https://${competitor.website}`}"
                target="_blank" 
                rel="noopener noreferrer"
                class="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ${competitor.website?.replace(/^https?:\/\//, '') || 'N/A'}
              </a>
            </div>
          </div>
          
          <p class="text-sm text-gray-700 mb-4 leading-relaxed">
            ${competitor.products || 'Product information not available'}
          </p>
          
          ${threshold !== null ? `
            <div class="mb-4">
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>$0</span>
                <span>$50</span>
                <span>$100</span>
                <span>$150</span>
                <span>$200+</span>
              </div>
              <div class="relative w-full bg-gray-200 rounded-full h-3">
                <div 
                  class="absolute h-3 rounded-full ${getThresholdColor(threshold)}"
                  style="width: ${getThresholdPosition(threshold)}%"
                ></div>
                <div 
                  class="absolute -top-1 w-5 h-5 bg-white border-2 border-gray-400 rounded-full flex items-center justify-center"
                  style="left: calc(${getThresholdPosition(threshold)}% - 10px); box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                >
                  <div class="w-2 h-2 rounded-full ${getThresholdColor(threshold)}"></div>
                </div>
              </div>
              <div class="text-center mt-2">
                <span class="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  $${threshold === 0 ? 'Free' : threshold} Free Shipping
                </span>
              </div>
            </div>
          ` : ''}

          <div class="space-y-2">
            ${incentiveLines.map(line => `
              <div class="flex items-start space-x-2">
                <div class="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span class="text-sm text-gray-700 leading-relaxed">${line}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shipping Analysis Report - ${websiteUrl}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background-color: #FBFAF9;
          }
          @media print {
            .print-notice { display: none; }
          }
        </style>
      </head>
      <body class="min-h-screen" style="background-color: #FBFAF9;">
        <div class="print-notice bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 text-center text-blue-800">
          <strong>💡 Print Tip:</strong> Use your browser's print function (Ctrl+P or Cmd+P) to save this report as a PDF or print it.
        </div>
        
        <div class="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div class="analysis-results-section rounded-lg p-6" style="background-color: #FBFAF9;">
            <!-- Brand Header -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div class="flex items-center">
                <img 
                  src="${logoUrl}"
                  alt="${brandName} logo"
                  class="w-12 h-12 mr-4 object-contain"
                  onerror="this.style.display='none'"
                />
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">${brandName}</h1>
                </div>
              </div>
            </div>
            
            <!-- Website URL -->
            <div class="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Website URL</h3>
              <a href="${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}" 
                 target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all">
                ${websiteUrl}
              </a>
            </div>

            <!-- Business Analysis -->
            <h2 class="text-2xl font-bold mb-6 text-gray-900">Business Analysis</h2>
            <div class="bg-white rounded-lg p-6 mb-8 shadow-sm">
              <div class="prose prose-gray max-w-none">
                ${businessAnalysis.replace(/\n/g, '<br>')}
              </div>
            </div>

            <!-- Competitor Analysis -->
            <div class="rounded-lg p-6" style="background-color: #FBFAF9;">
              <h2 class="text-2xl font-bold mb-6 text-gray-900">Competitor Analysis</h2>
              <div class="grid gap-6 md:grid-cols-2">
                ${competitorCardsHTML}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const createSimpleReportHTML = (websiteUrl: string, businessAnalysis: string, competitors: any) => {
    // Extract brand name from URL
    const extractBrandName = (url: string) => {
      try {
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const domain = cleanUrl.split('/')[0];
        const brandName = domain.split('.')[0];
        return brandName.charAt(0).toUpperCase() + brandName.slice(1);
      } catch {
        return 'Brand';
      }
    };

    const brandName = extractBrandName(websiteUrl);
    const logoUrl = `https://logo.clearbit.com/${websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}`;
    
    // Ensure competitors is an array - handle both array and object with competitors property
    const competitorsArray = Array.isArray(competitors) ? competitors : 
                             (competitors?.competitors ? competitors.competitors : []);
    
    // Generate competitor cards with threshold bars
    const competitorCards = competitorsArray.map((competitor, index) => {
      // Extract shipping threshold
      const extractThreshold = (text: string) => {
        if (!text) return null;
        const matches = text.match(/\$(\d+(?:\.\d{2})?)/g);
        if (!matches) return null;
        const amounts = matches.map(match => parseFloat(match.replace('$', '')));
        const commonThresholds = amounts.filter(amt => amt >= 25 && amt <= 300);
        return commonThresholds.length > 0 ? Math.min(...commonThresholds) : null;
      };

      const threshold = extractThreshold(competitor.shipping_incentives || '');
      
      // Calculate color and percentage for threshold bar
      const percentage = threshold ? Math.min((threshold / 200) * 100, 100) : 0;
      let colorClass = 'bg-gray-400';
      let chipClass = 'bg-gray-500 text-white';
      
      if (threshold) {
        if (threshold <= 50) {
          colorClass = 'bg-green-500';
          chipClass = 'bg-green-500 text-white';
        } else if (threshold <= 75) {
          colorClass = 'bg-yellow-500';
          chipClass = 'bg-yellow-500 text-black';
        } else if (threshold <= 100) {
          colorClass = 'bg-orange-500';
          chipClass = 'bg-orange-500 text-white';
        } else {
          colorClass = 'bg-red-500';
          chipClass = 'bg-red-500 text-white';
        }
      }

      return `
        <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex items-center mb-2">
            <img 
              src="https://logo.clearbit.com/${competitor.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}"
              alt="${competitor.name} logo"
              class="w-6 h-6 mr-3 object-contain"
              onerror="this.style.display='none'"
            />
            <h3 class="font-semibold text-lg text-gray-900">${competitor.name}</h3>
          </div>
          
          <p class="text-sm text-gray-700 mb-2">
            <span class="font-medium">Website:</span> 
            <a 
              href="${competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}"
              target="_blank" 
              rel="noopener noreferrer"
              class="text-blue-600 hover:text-blue-800 underline"
            >
              ${competitor.website.replace(/^https?:\/\//, '')}
            </a>
          </p>
          
          <p class="text-sm text-gray-700 mb-3">
            <span class="font-medium">Products:</span> ${competitor.products}
          </p>

          ${threshold ? `
            <div class="mb-3">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs text-gray-700">Free shipping threshold</span>
                <span class="px-2 py-1 rounded-full text-xs font-bold ${chipClass}">
                  $${threshold}
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  class="h-2.5 rounded-full transition-all duration-300 ${colorClass}"
                  style="width: ${Math.max(percentage, 5)}%;"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$200+</span>
              </div>
            </div>
          ` : ''}

          ${competitor.shipping_incentives ? `
            <div class="text-sm">
              <span class="font-medium text-gray-900">Shipping Incentives:</span>
              <div class="mt-1 text-gray-800 space-y-1">
                ${competitor.shipping_incentives.split('\n').slice(0, 5).map(line => {
                  const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
                  if (!cleanLine || cleanLine.endsWith(':**') || cleanLine.endsWith(':')) return '';
                  const formattedLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return `
                    <div class="flex items-start">
                      <span class="text-blue-600 mr-2">•</span>
                      <span class="text-sm">${formattedLine}</span>
                    </div>
                  `;
                }).filter(Boolean).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shipping Analysis Report - ${brandName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background-color: #FBFAF9; }
          @media print { .print-notice { display: none; } }
        </style>
      </head>
      <body class="min-h-screen" style="background-color: #FBFAF9;">
        <div class="print-notice bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 text-center text-blue-800">
          <strong>💡 Print Tip:</strong> Use your browser's print function (Ctrl+P or Cmd+P) to save this report as a PDF or print it.
        </div>
        
        <div class="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div class="rounded-lg p-6" style="background-color: #FBFAF9;">
            <!-- Brand Header -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div class="flex items-center">
                <img 
                  src="${logoUrl}"
                  alt="${brandName} logo"
                  class="w-12 h-12 mr-4 object-contain"
                  onerror="this.style.display='none'"
                />
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">${brandName}</h1>
                </div>
              </div>
            </div>
            
            <!-- Website URL -->
            <div class="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Website URL</h3>
              <a href="${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}" 
                 target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all">
                ${websiteUrl}
              </a>
            </div>

            <!-- Business Analysis -->
            <h2 class="text-2xl font-bold mb-6 text-gray-900">Business Analysis</h2>
            <div class="bg-white rounded-lg p-6 mb-8 shadow-sm">
              <div class="prose prose-gray max-w-none">
                ${businessAnalysis.replace(/\n/g, '<br>')}
              </div>
            </div>

            <!-- Competitor Analysis -->
            <div class="rounded-lg p-6" style="background-color: #FBFAF9;">
              <h2 class="text-2xl font-bold mb-6 text-gray-900">Competitor Analysis</h2>
              <div class="grid gap-6 md:grid-cols-2">
                ${competitorCards}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const createReportHTML = (websiteUrl: string, analysisResult: any) => {
    // Extract brand name from URL
    const extractBrandName = (url: string) => {
      try {
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const domain = cleanUrl.split('/')[0];
        const brandName = domain.split('.')[0];
        return brandName.charAt(0).toUpperCase() + brandName.slice(1);
      } catch {
        return 'Brand';
      }
    };

    const brandName = extractBrandName(websiteUrl);
    const logoUrl = `https://logo.clearbit.com/${websiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}`;
    
    // Parse business analysis sections
    const parseBusinessAnalysis = (analysis: string) => {
      const sections: { [key: string]: string } = {};
      const lines = analysis.split('\n');
      let currentSection = '';
      let currentContent = '';
      
      for (const line of lines) {
        if (line.includes(':') && !line.startsWith(' ') && !line.startsWith('-')) {
          if (currentSection && currentContent) {
            sections[currentSection] = currentContent.trim();
          }
          const parts = line.split(':');
          currentSection = parts[0].trim();
          currentContent = parts.slice(1).join(':').trim();
        } else {
          currentContent += '\n' + line;
        }
      }
      
      if (currentSection && currentContent) {
        sections[currentSection] = currentContent.trim();
      }
      
      return sections;
    };

    const sections = parseBusinessAnalysis(analysisResult.business_analysis);
    const competitors = analysisResult.competitors || [];

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shipping Analysis Report - ${websiteUrl}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { background-color: #FBFAF9; }
          @media print { .print-notice { display: none; } }
        </style>
      </head>
      <body class="min-h-screen" style="background-color: #FBFAF9;">
        <div class="print-notice bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 text-center text-blue-800">
          <strong>💡 Print Tip:</strong> Use your browser's print function (Ctrl+P or Cmd+P) to save this report as a PDF or print it.
        </div>
        <div class="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div class="rounded-lg p-6" style="background-color: #FBFAF9;">
            <!-- Brand Header -->
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div class="flex items-center">
                <img 
                  src="${logoUrl}"
                  alt="${brandName} logo"
                  className="w-12 h-12 mr-4 object-contain"
                  onError="this.style.display='none'"
                />
                <div>
                  <h1 class="text-3xl font-bold text-gray-900">${brandName}</h1>
                </div>
              </div>
            </div>
            
            <!-- 3-Column Header Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Industry</h3>
                <p class="text-gray-700">${sections['Industry'] || 'Not specified'}</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Current Shipping</h3>
                <div class="text-sm text-gray-500">No threshold data</div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Website URL</h3>
                <a href="${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}" 
                   target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all">
                  ${websiteUrl}
                </a>
              </div>
            </div>

            <!-- Business Analysis -->
            <h2 class="text-2xl font-bold mb-6 text-gray-900">Business Analysis</h2>
            <div class="bg-white rounded-lg p-6 mb-8 shadow-sm">
              <div class="prose prose-gray max-w-none">
                ${analysisResult.business_analysis.replace(/\n/g, '<br>')}
              </div>
            </div>

            <!-- Competitors Analysis (exact homepage format converted to HTML) -->
            <div class="rounded-lg p-6" style="background-color: #FBFAF9;">
              <h2 class="text-2xl font-bold mb-6 text-gray-900">Competitor Analysis</h2>
              <div class="grid gap-6 md:grid-cols-2">
                ${(() => {
                  // EXACT homepage logic - Calculate dynamic range from all competitors
                  const allThresholds = competitors
                    .map(comp => {
                      const shippingText = comp.shipping_incentives || '';
                      const dollarMatches = shippingText.match(/\$(\d+(?:\.\d{2})?)/g);
                      if (!dollarMatches) return null;
                      const amounts = dollarMatches.map(match => parseFloat(match.replace('$', '')));
                      const commonThresholds = amounts.filter(amt => amt >= 25 && amt <= 300);
                      return commonThresholds.length > 0 ? Math.min(...commonThresholds) : null;
                    })
                    .filter(Boolean) as number[];
                  
                  const minThreshold = allThresholds.length > 0 ? Math.min(...allThresholds) : 0;
                  const maxThreshold = allThresholds.length > 0 ? Math.max(...allThresholds) : 200;

                  return competitors.map((competitor: any, index: number) => {
                    // EXACT homepage extractThreshold function
                    const extractThreshold = (shippingText: string) => {
                      if (!shippingText) return null;
                      const dollarMatches = shippingText.match(/\$(\d+(?:\.\d{2})?)/g);
                      if (!dollarMatches) return null;
                      const amounts = dollarMatches.map(match => parseFloat(match.replace('$', '')));
                      const commonThresholds = amounts.filter(amt => amt >= 25 && amt <= 300);
                      return commonThresholds.length > 0 ? Math.min(...commonThresholds) : null;
                    };

                    const threshold = extractThreshold(competitor.shipping_incentives || '');
                    
                    // EXACT homepage ThresholdBar logic converted to HTML
                    const createThresholdBarHTML = (threshold: number | null) => {
                      if (!threshold) return '';
                      
                      const range = maxThreshold - minThreshold || 1;
                      const percentage = ((threshold - minThreshold) / range) * 100;
                      
                      // Dynamic color based on position in actual range (green to red)
                      const colorRatio = percentage / 100;
                      const red = Math.round(colorRatio * 255);
                      const green = Math.round((1 - colorRatio) * 255);
                      const bgColor = `rgb(${red}, ${green}, 0)`;
                      
                      // Matching chip color classes
                      let chipColorClass = 'bg-green-500 text-white';
                      if (colorRatio > 0.75) chipColorClass = 'bg-red-500 text-white';
                      else if (colorRatio > 0.5) chipColorClass = 'bg-orange-500 text-white';
                      else if (colorRatio > 0.25) chipColorClass = 'bg-yellow-500 text-black';
                      
                      return `
                        <div class="mb-3">
                          <div class="flex justify-between items-center mb-2">
                            <span class="text-xs text-gray-700">Free shipping threshold</span>
                            <span class="px-2 py-1 rounded-full text-xs font-bold ${chipColorClass}">
                              $${threshold}
                            </span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              class="h-2.5 rounded-full transition-all duration-300"
                              style="width: ${Math.max(percentage, 5)}%; background-color: ${bgColor};"
                            ></div>
                          </div>
                          <div class="flex justify-between text-xs text-gray-500 mt-1">
                            <span>$${minThreshold}</span>
                            <span>$${maxThreshold}</span>
                          </div>
                        </div>
                      `;
                    };

                    return `
                      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-center mb-2">
                          <img 
                            src="https://logo.clearbit.com/${competitor.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}"
                            alt="${competitor.name} logo"
                            class="w-6 h-6 mr-3 object-contain"
                            onerror="this.style.display='none'"
                          />
                          <h3 class="font-semibold text-lg text-gray-900">${competitor.name}</h3>
                        </div>
                        
                        <p class="text-sm text-gray-700 mb-2">
                          <span class="font-medium">Website:</span> 
                          <a 
                            href="${competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}"
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="text-blue-600 hover:text-blue-800 underline"
                          >
                            ${competitor.website.replace(/^https?:\/\//, '')}
                          </a>
                        </p>
                        
                        <p class="text-sm text-gray-700 mb-3">
                          <span class="font-medium">Products:</span> ${competitor.products}
                        </p>

                        ${createThresholdBarHTML(threshold)}

                        ${competitor.shipping_incentives ? `
                          <div class="text-sm">
                            <span class="font-medium text-gray-900">Shipping Incentives:</span>
                            <div class="mt-1 text-gray-800 space-y-1">
                              ${competitor.shipping_incentives.split('\n').slice(0, 5).map(line => {
                                const cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
                                if (!cleanLine || cleanLine.endsWith(':**') || cleanLine.endsWith(':')) return '';
                                const formattedLine = cleanLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                return `
                                  <div class="flex items-start">
                                    <span class="text-blue-600 mr-2">•</span>
                                    <span class="text-sm">${formattedLine}</span>
                                  </div>
                                `;
                              }).filter(Boolean).join('')}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }).join('');
                })()}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">Please sign in to view your profile.</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      setMessage('Profile updated successfully!');
      setEditing(false);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Profile page: initiating sign out');
      await signOut();
    } catch (error) {
      console.error('Profile page: sign out error', error);
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FBFAF9' }}>

      <main className="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-[100px]">
        <div className="bg-white rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-700">Manage your account information</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Progressive Name Collection Prompt */}
            {!user?.fullName && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Help us personalize your reports
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Adding your name helps us create more personalized recommendations and email reports tailored to you.
                    </p>
                    <form onSubmit={handleUpdateProfile} className="flex items-center space-x-3">
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!fullName.trim() || loading}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save Name'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  {editing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-3">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your full name"
                        required
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(false);
                            setFullName(user?.fullName || '');
                          }}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={user?.fullName || 'Not set'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                      <button
                        onClick={() => setEditing(true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis History */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Analysis History</h2>
                  <p className="text-sm text-gray-700 mt-1">View and download your previous competitor analyses</p>
                </div>
                <button
                  onClick={loadAnalysisHistory}
                  disabled={historyLoading}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 text-sm"
                >
                  {historyLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Analysis Statistics */}
              <div className="mb-6 rounded-lg p-6" style={{ backgroundColor: '#FBFAF9' }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">
                      {statsLoading ? '...' : analysisHistory.length}
                    </div>
                    <div className="text-sm text-gray-600">Total Analyses</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">
                      {statsLoading ? '...' : analysisHistory.filter(record => record.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">
                      {statsLoading ? '...' : analysisHistory.reduce((sum, record) => sum + (record.competitor_count || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Competitors Analyzed</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-500">
                      {statsLoading ? '...' : analysisHistory.filter(record => record.business_analysis && record.competitors_data).length}
                    </div>
                    <div className="text-sm text-gray-600">Reports Available</div>
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-700">Loading analysis history...</p>
                </div>
              ) : analysisHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead style={{ backgroundColor: '#FBFAF9' }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Website URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Analysis Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Competitors Found
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={record.website_url}>
                              {record.website_url}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(record.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-lg font-semibold text-black">{record.competitor_count}</div>
                            <div className="text-xs text-gray-500">competitors</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 capitalize">
                              {record.analysis_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {record.status === 'completed' && record.business_analysis && record.competitors_data && (
                              <button
                                onClick={() => viewReport(record)}
                                disabled={generatingPdf === record.id}
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center disabled:opacity-50"
                              >
                                {generatingPdf === record.id ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 mr-1 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                    Loading...
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Report
                                  </>
                                )}
                              </button>
                            )}
                            {record.status === 'failed' && (
                              <button
                                onClick={() => window.open(`/?url=${encodeURIComponent(record.website_url)}`, '_blank')}
                                className="text-orange-600 hover:text-orange-800 inline-flex items-center"
                              >
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Retry
                              </button>
                            )}
                            {record.status === 'processing' && (
                              <span className="text-yellow-600 inline-flex items-center">
                                <div className="animate-spin h-4 w-4 mr-1 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                                Processing...
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No analyses yet</h3>
                  <p className="mt-2 text-gray-600">Start by analyzing your first competitor website to see results here.</p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-black"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start Analysis
                  </Link>
                </div>
              )}

              {/* Pagination Controls */}
              {analysisHistory.length > 0 && totalRecords > recordsPerPage && (
                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} results
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.ceil(totalRecords / recordsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages adjacent to current
                          const totalPages = Math.ceil(totalRecords / recordsPerPage);
                          return page === 1 || page === totalPages || 
                                 (page >= currentPage - 1 && page <= currentPage + 1);
                        })
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 text-sm font-medium rounded-md ${
                                  currentPage === page
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(totalRecords / recordsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(totalRecords / recordsPerPage)}
                      className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Subscriptions */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Active Subscriptions</h2>
                  <p className="text-sm text-gray-700 mt-1">Manage your bi-weekly monitoring subscriptions</p>
                </div>
                <button
                  onClick={loadSubscriptions}
                  disabled={subscriptionsLoading}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 text-sm"
                >
                  {subscriptionsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              
              {subscriptionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-700">Loading subscriptions...</p>
                </div>
              ) : subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-col h-full">
                        {/* Top row - URL, Active badge, Started date */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate" title={subscription.website_url}>
                              {subscription.website_url}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subscription.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subscription.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Started: {new Date(subscription.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        
                        {/* Bottom row - Type, Price, Next Report, Action buttons */}
                        <div className="flex justify-between items-center text-sm">
                          <div className="grid grid-cols-3 gap-6 flex-1">
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-1 text-gray-900 capitalize">
                                {subscription.subscription_type.replace('_', ' ')}
                              </span>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <span className="ml-1 text-orange-500 font-medium">
                                ${subscription.price_monthly}/month
                              </span>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Next Report:</span>
                              <span className="ml-1 text-gray-900">
                                {new Date(subscription.next_report_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            {subscription.is_active ? (
                              <>
                                <button 
                                  onClick={() => handleEditSubscription(subscription)}
                                  className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleCancelSubscription(subscription)}
                                  className="text-xs text-red-600 hover:text-red-800 border border-red-300 px-2 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleDeleteSubscription(subscription.id)}
                                className="text-xs text-red-600 hover:text-red-800 border border-red-300 px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-700 mb-2">No active subscriptions</p>
                  <p className="text-sm text-gray-500">Subscribe to bi-weekly reports to monitor competitor shipping changes</p>
                  <Link href="/pricing" className="inline-block mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors text-sm">
                    View Pricing
                  </Link>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                  <p className="text-sm text-gray-700 mt-1">View your payment transactions and token purchases</p>
                </div>
                <button
                  onClick={loadPaymentHistory}
                  disabled={paymentLoading}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black disabled:opacity-50 text-sm"
                >
                  {paymentLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {paymentLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-700">Loading payment history...</p>
                </div>
              ) : paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead style={{ backgroundColor: '#FBFAF9' }}>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens Purchased
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(payment.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${payment.amount.toFixed(2)} {payment.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center">
                              {payment.paymentMethod === 'Card' ? (
                                <>
                                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  <span className="font-medium">{payment.cardBrand}</span>
                                  <span className="ml-2 text-gray-500">•••• {payment.cardLast4}</span>
                                </>
                              ) : payment.paymentMethod === 'Coupon' ? (
                                <>
                                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  {payment.paymentMethod}
                                </>
                              ) : (
                                payment.paymentMethod
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-lg font-semibold text-orange-500">{payment.tokensPurchased}</div>
                            <div className="text-xs text-gray-500">tokens</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              payment.status === 'completed' || payment.status === 'succeeded'
                                ? 'bg-green-100 text-green-800'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status === 'succeeded' ? 'Completed' : payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No payments yet</h3>
                  <p className="mt-2 text-gray-600">Your payment history will appear here after making purchases.</p>
                  <Link
                    href="/pricing"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-black"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Buy Tokens
                  </Link>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/pricing"
                  className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black"
                >
                  Purchase Analysis Tokens
                </Link>
              </div>
            </div>

            {/* Sign Out */}
            <div className="pt-6">
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <EditSubscriptionModal
          subscription={editingSubscription}
          isOpen={!!editingSubscription}
          onClose={() => setEditingSubscription(null)}
          onSave={handleSaveSubscription}
        />
      )}

      {/* Cancel Subscription Modal */}
      {cancellingSubscription && (
        <CancelSubscriptionModal
          subscription={cancellingSubscription}
          isOpen={!!cancellingSubscription}
          onClose={() => setCancellingSubscription(null)}
          onCancel={handleConfirmCancelSubscription}
        />
      )}
    </div>
  );
}