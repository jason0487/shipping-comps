'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import SignInModal from '@/components/auth/SignInModal';

interface Competitor {
  name: string;
  website: string;
  products: string;
  shipping_incentives: string;
}

interface AnalysisResult {
  success: boolean;
  business_analysis: string;
  business_summary?: string;
  competitors: Competitor[];
  user_shipping: any;
}

// Email Form Component
const ActionPlanEmailForm = ({ onSubmit, isLoading, user }: { onSubmit: (email: string) => void, isLoading: boolean, user: any }) => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onSubmit(email);
    }
  };

  const handleLoggedInSubmit = () => {
    if (user?.email) {
      onSubmit(user.email);
    }
  };

  // If user is logged in, show button with their email
  if (user?.email) {
    return (
      <div className="max-w-md mx-auto text-center">
        <button
          onClick={handleLoggedInSubmit}
          disabled={isLoading}
          className="bg-orange-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Me My Report'}
        </button>
        <p className="text-sm text-gray-600 mt-3">
          Report will be sent to <span className="font-medium">{user.email}</span>
        </p>
      </div>
    );
  }

  // If user is not logged in, show email input form
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 h-[52px] pr-48 text-sm placeholder:text-sm border border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-gray-900 bg-white"
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute top-2 bottom-2 right-2 flex items-center bg-orange-600 text-white px-4 rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send Me My Report'}
        </button>
      </div>
    </form>
  );
};

// Password Prompt Modal Component
const PasswordPromptModal = ({ email, isOpen, onSubmit, onSkip }: { 
  email: string, 
  isOpen: boolean,
  onSubmit: (password: string) => void, 
  onSkip: () => void 
}) => {
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      setIsCreating(true);
      await onSubmit(password);
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-w-md w-full p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">
              Action plan sent to {email}!
            </span>
          </div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Complete Your Account Setup
          </h4>
          <p className="text-sm text-gray-600">
            Create a password for <strong>{email}</strong> to access your analysis history and get future reports
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password (min 6 characters)"
            className="w-full px-4 h-[52px] text-sm placeholder:text-sm border border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-gray-900 bg-white"
            required
            disabled={isCreating}
            minLength={6}
          />
          <button
            type="submit"
            className="w-full bg-orange-600 text-white h-[52px] rounded-2xl text-sm font-bold hover:bg-orange-700 transition-colors"
          >
            {isCreating ? 'Creating Account...' : 'Create Account'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors mt-3 py-2"
          >
            Skip for Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Progress tracking state
  const [currentStage, setCurrentStage] = useState('');
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [error, setError] = useState('');
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [sendingActionPlan, setSendingActionPlan] = useState(false);
  const [actionPlanSent, setActionPlanSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const [hasUsedFreeReport, setHasUsedFreeReport] = useState(false);
  const [cachedReportUrl, setCachedReportUrl] = useState('');
  const [showTokensRequiredModal, setShowTokensRequiredModal] = useState(false);
  const [actionPlanEmail, setActionPlanEmail] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [emailSentConfirmation, setEmailSentConfirmation] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const { user, signIn, signUp, signOut, refreshTokens, isAuthenticated } = useAuth();

  // Fetch token balance when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTokenBalance();
    }
  }, [isAuthenticated, user]);

  // Load cached report and usage status on component mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        // Check if user has used their free report
        const freeReportUsed = localStorage.getItem('free_report_used');
        const cachedReport = localStorage.getItem('cached_analysis');
        const cachedUrl = localStorage.getItem('cached_url');
        
        if (freeReportUsed === 'true') {
          setHasUsedFreeReport(true);
        }
        
        if (cachedReport && cachedUrl) {
          const parsedReport = JSON.parse(cachedReport);
          setResult(parsedReport);
          setUrl(cachedUrl);
          setCachedReportUrl(cachedUrl);
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };
    
    loadCachedData();
  }, []);

  const fetchTokenBalance = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/user-stats?userId=${user.id}`);
      if (!response.ok) {
        console.warn('Failed to fetch token balance, using cached value');
        return;
      }
      const data = await response.json();
      setTokenBalance(data.tokensRemaining || 0);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      // Don't update token balance on error to prevent logout issues
    }
  };

  const handleSaveReport = async (websiteUrl: string, analysisResult: AnalysisResult) => {
    setGeneratingPdf(true);
    
    try {
      // Wait a moment for the DOM to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the exact HTML content from the results section on this page
      const resultsSection = document.querySelector('.analysis-results-section') as HTMLElement;
      if (!resultsSection) {
        console.error('Could not find analysis results section');
        setError('Error: Could not find analysis results to save.');
        setGeneratingPdf(false);
        return;
      }

      // Clone the section to avoid modifying the original
      const clonedSection = resultsSection.cloneNode(true) as HTMLElement;
      
      // Remove the button from the cloned version
      const button = clonedSection.querySelector('button');
      if (button) {
        button.remove();
      }

      // Create the complete HTML with the exact content and inline styles
      const htmlContent = `
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
            ${clonedSection.outerHTML}
          </div>
        </body>
        </html>
      `;

      // Store this HTML in the database for future access if it's a real analysis
      if (analysisResult.analysisId && !analysisResult.analysisId.startsWith('temp-') && user?.id) {
        try {
          await fetch('/api/store-html-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              analysisId: analysisResult.analysisId,
              htmlContent: htmlContent,
              userId: user.id
            }),
          });
        } catch (storeError) {
          console.error('Error storing HTML report:', storeError);
          // Don't fail the main operation if storage fails
        }
      }

      // Open HTML report in new tab
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
      } else {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Save report to cache whenever result changes
  useEffect(() => {
    if (result && url) {
      try {
        localStorage.setItem('cached_analysis', JSON.stringify(result));
        localStorage.setItem('cached_url', url);
        setCachedReportUrl(url);
      } catch (error) {
        console.error('Error caching report:', error);
      }
    }
  }, [result, url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a website URL');
      return;
    }

    // Auto-add https:// if not present
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    // Update the URL state to show the normalized URL
    setUrl(normalizedUrl);

    // Pre-validate tokens before starting analysis
    if (isAuthenticated && tokenBalance <= 0) {
      setError('No analysis tokens remaining. Redirecting to pricing...');
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 2000);
      return;
    }

    // Check IP limit for non-authenticated users
    if (!isAuthenticated && hasUsedFreeReport) {
      setError('Free monthly analysis limit reached. Redirecting to pricing...');
      setTimeout(() => {
        window.location.href = '/pricing';
      }, 2000);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    
    // Reset progress state
    setCurrentStage('');
    setCompletedStages([]);
    setProgressMessage('');
    setAnalysisProgress(0);

    // Generate session ID for progress tracking
    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let eventSource: EventSource | undefined;

    try {
      // Set up Server-Sent Events for progress updates
      eventSource = new EventSource(`/api/analysis-progress?sessionId=${sessionId}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setCurrentStage(data.stage);
          setProgressMessage(data.message);
          setAnalysisProgress(data.progress);
          setCompletedStages(data.completedStages);
        } else if (data.type === 'complete') {
          setResult(data.result);
          eventSource.close();
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
      };
      
      // Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        eventSource.close();
      }, 600000); // 600 second timeout (10 minutes)
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          website_url: normalizedUrl,
          user_id: user?.id || null,
          session_id: sessionId
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      eventSource.close(); // Clean up SSE connection

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle token limit errors
        if (errorData.reason === 'no_tokens' || errorData.reason === 'ip_limit') {
          setError(errorData.error);
          setTimeout(() => {
            window.location.href = '/pricing';
          }, 3000);
          return;
        }
        
        // Handle bot protection and scraping errors with user-friendly messages
        if (errorData.reason === 'bot_protection') {
          setError(errorData.error);
          return;
        }
        
        if (errorData.reason === 'scraping_failed') {
          setError(errorData.error);
          return;
        }
        
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      console.log('Analysis response data:', data);
      setResult(data);
      
      // Dispatch analysis completion event to refresh session
      window.dispatchEvent(new CustomEvent('analysisCompleted'));
      
      // Update token balance after successful analysis
      if (isAuthenticated && user) {
        // Get fresh token count from database (token was already deducted in backend)
        setTimeout(() => {
          if (refreshTokens) {
            refreshTokens();
          }
        }, 2000); // Slightly longer delay to ensure database update is complete
      } else {
        // Mark free report as used for non-authenticated users
        localStorage.setItem('free_report_used', 'true');
        setHasUsedFreeReport(true);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      
      // Clean up SSE connection on error
      if (eventSource) {
        eventSource.close();
      }
      
      // Handle timeout errors specifically
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Analysis timeout reached. Redirecting to your profile page to check for completed results...');
        // Auto-redirect to profile page after timeout since analysis likely completed
        setTimeout(() => {
          window.location.href = '/profile';
        }, 3000);
      } else if (err instanceof Error) {
        setError(`Analysis failed: ${err.message}`);
      } else {
        setError('Failed to analyze website. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendActionPlan = async (email: string) => {
    if (!result) {
      alert('Please complete an analysis first');
      return;
    }

    setSendingActionPlan(true);
    
    try {
      const response = await fetch('/api/send-action-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: email.split('@')[0], // Use email username as temporary name
          websiteUrl: url,
          analysisResult: result
        }),
      });

      if (response.ok) {
        setActionPlanEmail(email);
        setEmailSentConfirmation(true);
        setShowPasswordPrompt(true);
        setSentToEmail(email);
      } else {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(`Failed to send action plan: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending action plan:', error);
      console.error('Error details:', error.message);
      alert(`Failed to send action plan: ${error.message || 'Please try again.'}`);
    } finally {
      setSendingActionPlan(false);
    }
  };

  const handleCompleteSignup = async (password: string) => {
    try {
      await signUp(actionPlanEmail, password);
      setActionPlanSent(true);
      setShowPasswordPrompt(false);
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
        {/* Hero Section */}
        <div className={`relative text-center rounded-3xl border border-white/20 pt-10 md:px-12 px-4 mt-[100px] ${result ? 'pb-8' : 'pb-0 min-h-[500px] md:min-h-[650px]'}`} style={{
          backgroundColor: '#FBF8F6',
          backgroundImage: 'url(/images/radial-background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center calc(50% + 9rem)',
          backgroundRepeat: 'no-repeat'
        }}>
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-orange-600 text-sm font-medium mb-8">
            🚀 Get real-time competitor intelligence
          </div>
          
          {/* Main Heading */}
          <h1 className="font-bold text-gray-900 mb-6 leading-none" style={{ fontSize: '60px' }}>
            Shipping intelligence
            <br />
            <span className="text-orange-500">for e-commerce</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed" style={{ fontSize: '16px' }}>
            Analyze competitor shipping strategies with AI-powered insights.
            <br />
            Optimize your logistics and boost conversions.
          </p>
          
          {/* Input Form or Status Message */}
          <div className="max-w-md mx-auto mb-8">
            {result ? (
              /* Clean Status Message when showing results */
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl">
                  <div className="font-semibold mb-1">✓ Analysis Complete</div>
                  <div className="text-xs text-green-600">Report for {cachedReportUrl}</div>
                </div>
                <button
                  onClick={() => {
                    if (isAuthenticated && user) {
                      // Authenticated users can start new analysis directly
                      setResult(null);
                      setUrl('');
                      localStorage.removeItem('cached_analysis');
                      localStorage.removeItem('cached_url');
                      setCachedReportUrl('');
                    } else {
                      // Non-authenticated users need to purchase tokens
                      setShowTokensRequiredModal(true);
                    }
                  }}
                  className="bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  New Analysis
                </button>
              </div>
            ) : (
              /* Regular Input Form */
              <form onSubmit={handleSubmit} className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="example.com or https://example.com"
                    className="w-full px-4 h-[52px] pr-36 text-sm placeholder:text-sm border border-gray-300 rounded-2xl focus:border-orange-500 focus:outline-none text-gray-900 bg-white"
                    disabled={
                      loading || 
                      (isAuthenticated && tokenBalance <= 0) ||
                      (!isAuthenticated && hasUsedFreeReport)
                    }
                  />
                  <button
                    type="submit"
                    disabled={
                      loading || 
                      (isAuthenticated && tokenBalance <= 0) ||
                      (!isAuthenticated && hasUsedFreeReport)
                    }
                    onClick={(isAuthenticated && tokenBalance <= 0) || (hasUsedFreeReport && !isAuthenticated) ? 
                      () => window.location.href = '/pricing' : undefined}
                    className="absolute top-2 bottom-2 right-2 flex items-center bg-gray-900 text-white px-4 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        Analyzing
                        <span className="animate-pulse">
                          <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </span>
                      </span>
                    ) : 
                     (isAuthenticated && tokenBalance <= 0) ? 'Buy Tokens' :
                     hasUsedFreeReport && !isAuthenticated ? 'Sign Up' : 
                     isAuthenticated ? 'Analyze Now' : 'Try for Free'}
                  </button>
                </div>
                
                {/* Helper text for authenticated users */}
                {isAuthenticated && (
                  <div className="text-right text-xs text-gray-500 mt-0 pr-4">
                    1 Token per Report
                  </div>
                )}
                
                {/* Usage Status Messages */}
                {hasUsedFreeReport && !isAuthenticated && (
                  <div className="relative z-[60] bg-orange-50 border border-orange-200 text-orange-700 text-sm text-center p-3 rounded-lg">
                    <div>
                      <div className="font-bold">Free analysis used.</div>
                      <div>Sign up to get more reports and access your analysis history.</div>
                    </div>
                  </div>
                )}
                
                {/* Enhanced Progress Display */}
                {loading && (
                  <div className="relative z-10 bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 text-orange-700 p-6 rounded-xl mt-4 shadow-sm">
                    <div className="text-center mb-4">
                      <div className="font-bold text-lg mb-1">🔍 Deep Analysis in Progress</div>
                      <div className="text-sm text-orange-600 mb-2">Expected time: ~6 minutes</div>
                      <div className="text-sm text-orange-600 mb-3">We're doing the heavy lifting so you don't have to</div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-orange-200 rounded-full h-3 mb-4">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Current Status */}
                    {progressMessage && (
                      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-orange-500">
                        <div className="font-medium text-black mb-1">{currentStage}</div>
                        <div className="text-sm text-orange-700">{progressMessage}</div>
                      </div>
                    )}

                    {/* Stage Progress Checklist */}
                    <div className="space-y-2 text-left">
                      {[
                        { id: 'discovery', label: 'Discovering Competitors', desc: 'Finding your top 10 shipping competitors...' },
                        { id: 'verification', label: 'Verifying URLs', desc: 'Ensuring all competitor websites are accessible...' },
                        { id: 'extraction', label: 'Extracting Shipping Data', desc: 'Scanning checkout pages and shipping policies...' },
                        { id: 'intelligence', label: 'Business Intelligence Analysis', desc: 'Analyzing return policies, customer service, pricing...' },
                        { id: 'synthesis', label: 'Synthesizing Report', desc: 'Creating your competitive analysis report...' }
                      ].map((stage) => (
                        <div key={stage.id} className="flex items-start space-x-3">
                          <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                            ${completedStages.includes(stage.id) 
                              ? 'bg-green-500 text-white' 
                              : currentStage === stage.label 
                                ? 'bg-orange-500 text-white animate-pulse' 
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                            {completedStages.includes(stage.id) ? '✓' : 
                             currentStage === stage.label ? '•' : '○'}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${
                              completedStages.includes(stage.id) ? 'text-green-700' :
                              currentStage === stage.label ? 'text-black' : 'text-gray-600'
                            }`}>
                              {stage.label}
                            </div>
                            <div className={`text-xs ${
                              completedStages.includes(stage.id) ? 'text-green-600' :
                              currentStage === stage.label ? 'text-orange-700' : 'text-gray-500'
                            }`}>
                              {stage.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-orange-200 text-center">
                      <div className="text-xs text-orange-600">
                        💡 Analysis running in background • Check your profile page if timeout occurs
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="relative z-[60] bg-red-50 border border-red-200 text-red-600 text-sm text-left p-3 rounded-lg mt-2">{error}</div>
                )}
              </form>
            )}
          </div>

          {/* Hero Image - Only show when no result */}
          {!result && (
            <div className="mt-0 flex justify-center items-end flex-1">
              <div className="w-full max-w-4xl">
                {/* Desktop Image */}
                <img
                  src="/images/HeroImageV3.png"
                  alt="Shipping Comps Platform Preview"
                  className="w-full h-auto rounded-lg hidden md:block"
                />
                {/* Mobile Image - Bottom aligned with no padding */}
                <img
                  src="/images/HeroImageMobile.png?v=2"
                  alt="Shipping Comps Platform Preview"
                  className="w-full h-auto rounded-lg block md:hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Brand Scroller Section */}
        {!result && (
          <div className="mt-20 mb-20">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-black mb-2">
                See how your brand compares to some of the best in the industry
              </h2>
              <p className="text-gray-600">
                Analyze shipping strategies from leading ecommerce brands
              </p>
            </div>
            
            <div className="relative overflow-hidden bg-white py-8 rounded-2xl">
              {/* Gradient overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
              
              {/* Top row - moving right to left */}
              <div className="flex space-x-16 animate-scroll-left mb-8">
                {/* First set of logos */}
                <div className="flex space-x-16 min-w-max">
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/nike.png" alt="Nike" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/adidas.png" alt="Adidas" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/puma.png" alt="Puma" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/lululemon.png" alt="Lululemon" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/gap.png" alt="Gap" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/zara.png" alt="Zara" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/bonobos.png" alt="Bonobos" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/pandora.png" alt="Pandora" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/tecovas.png" alt="Tecovas" className="h-8 w-auto" />
                  </div>
                </div>
                {/* Duplicate set for seamless loop */}
                <div className="flex space-x-16 min-w-max">
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/nike.png" alt="Nike" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/adidas.png" alt="Adidas" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/puma.png" alt="Puma" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/lululemon.png" alt="Lululemon" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/gap.png" alt="Gap" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/zara.png" alt="Zara" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/bonobos.png" alt="Bonobos" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/pandora.png" alt="Pandora" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/tecovas.png" alt="Tecovas" className="h-8 w-auto" />
                  </div>
                </div>
              </div>
              
              {/* Bottom row - moving left to right */}
              <div className="flex space-x-16 animate-scroll-right">
                {/* First set of logos */}
                <div className="flex space-x-16 min-w-max">
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/vans.png" alt="Vans" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/skims.png" alt="Skims" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/alo-yoga.png" alt="Alo Yoga" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/birchbox.png" alt="Birchbox" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/patagonia.png" alt="Patagonia" className="h-8 w-auto" />
                  </div>
                </div>
                {/* Duplicate set for seamless loop */}
                <div className="flex space-x-16 min-w-max">
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/vans.png" alt="Vans" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/skims.png" alt="Skims" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/alo-yoga.png" alt="Alo Yoga" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/birchbox.png" alt="Birchbox" className="h-8 w-auto" />
                  </div>
                  <div className="flex items-center justify-center h-12 w-32 opacity-100">
                    <img src="/images/logos/patagonia.png" alt="Patagonia" className="h-8 w-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Results - Moved up when showing */}
          {result && (
            <div className="space-y-8 mt-4 analysis-results-section">
              {/* Business Analysis */}
              {result.business_analysis && (() => {
                // Parse business analysis to extract structured data
                const parseBusinessAnalysis = (analysis: string) => {
                  const sections: { [key: string]: string } = {};
                  const lines = analysis.split('\n');
                  let currentSection = '';
                  let currentContent = '';

                  lines.forEach(line => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.includes(':') && trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                      // Save previous section
                      if (currentSection && currentContent) {
                        sections[currentSection] = currentContent.trim();
                      }
                      // Start new section
                      currentSection = trimmedLine.replace(/\*\*/g, '').replace(':', '').trim();
                      currentContent = '';
                    } else if (currentSection && trimmedLine) {
                      currentContent += trimmedLine + '\n';
                    }
                  });
                  
                  // Save last section
                  if (currentSection && currentContent) {
                    sections[currentSection] = currentContent.trim();
                  }
                  
                  return sections;
                };

                const sections = parseBusinessAnalysis(result.business_analysis);
                
                // Convert markdown formatting to HTML
                const convertMarkdownToHtml = (text: string) => {
                  return text
                    // Convert **bold** to <strong>
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    // Convert bullet points - to <li>
                    .replace(/^- (.+)$/gm, '<li>$1</li>')
                    // Wrap consecutive <li> items in <ul>
                    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
                    // Convert line breaks to <br>
                    .replace(/\n/g, '<br>');
                };

                // Extract user shipping info from dedicated user_site_data field
                const extractUserShippingInfo = () => {
                  // Use the dedicated user_site_data field from the API response
                  if (result.user_site_data) {
                    const userSiteData = result.user_site_data;
                    const comprehensiveData = userSiteData.comprehensiveData || userSiteData.businessData;
                    
                    if (comprehensiveData?.shipping_incentives?.[0]) {
                      const incentive = comprehensiveData.shipping_incentives[0];
                      const amount = incentive.threshold_amount;
                      const policy = incentive.policy || '';
                      
                      // PRIORITIZE POLICY TEXT FIRST for free shipping detection
                      const lowerPolicy = policy.toLowerCase();
                      // Only detect as free shipping if it doesn't mention "over" or a dollar amount
                      if (lowerPolicy.includes('free') && 
                          (lowerPolicy.includes('conus') || 
                           (lowerPolicy.includes('shipping') && 
                            !lowerPolicy.includes('over') && 
                            !lowerPolicy.includes('$') && 
                            !lowerPolicy.includes('orders')))) {

                        return { threshold: 0, type: 'free', displayText: policy };
                      }
                      
                      if (lowerPolicy.includes('calculated at checkout') || lowerPolicy.includes('shipping & taxes calculated')) {
                        return { threshold: null, type: 'calculated', displayText: 'Shipping calculated at checkout' };
                      }
                      
                      // Only check threshold amounts if no clear free shipping policy was found
                      if (amount === 0 || amount === '0' || amount === 0.0) {
                        return { threshold: 0, type: 'free', displayText: policy || 'Free shipping' };
                      }
                      
                      if (typeof amount === 'string') {
                        const match = amount.match(/\$?(\d+(?:\.\d{2})?)/);
                        if (match) {
                          return { threshold: parseFloat(match[1]), type: 'threshold', displayText: `$${match[1]}+ for free shipping` };
                        }
                      }
                      
                      if (typeof amount === 'number' && amount > 0) {
                        return { threshold: amount, type: 'threshold', displayText: `$${amount}+ for free shipping` };
                      }
                      
                      // If we have policy text but no clear threshold
                      if (policy) {
                        return { threshold: null, type: 'policy', displayText: policy };
                      }
                    }
                  }
                  
                  // FALLBACK: try direct user_shipping data only if Firecrawl data wasn't found
                  if (result.user_shipping?.threshold !== null && result.user_shipping?.threshold !== undefined) {
                    const threshold = result.user_shipping.threshold;
                    if (typeof threshold === 'number') {
                      return { threshold, type: 'threshold', displayText: `$${threshold}+ for free shipping` };
                    }
                    if (typeof threshold === 'string') {
                      const match = threshold.match(/\$?(\d+(?:\.\d{2})?)/);
                      if (match) {
                        const amount = parseFloat(match[1]);
                        return { threshold: amount, type: 'threshold', displayText: `$${amount}+ for free shipping` };
                      }
                    }
                  }
                  
                  // No shipping data found
                  return { threshold: null, type: 'unknown', displayText: 'Shipping policy not specified' };
                };

                const userShippingInfo = extractUserShippingInfo();
                const userThreshold = userShippingInfo.threshold;
                
                // Create shipping threshold bar component
                const UserShippingBar = ({ shippingInfo }: { shippingInfo: any }) => {
                  if (!shippingInfo) return <div className="text-sm text-gray-500">Shipping policy not specified</div>;
                  
                  const { threshold, type, displayText } = shippingInfo;
                  
                  // Handle non-threshold cases
                  if (type === 'calculated' || type === 'policy' || type === 'unknown') {
                    return (
                      <div className="text-sm text-gray-600">
                        {displayText}
                      </div>
                    );
                  }
                  
                  // Handle free shipping
                  if (threshold === 0 || type === 'free') {
                    return (
                      <div>
                        <div className="text-gray-700 mb-3">
                          {displayText}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-300 bg-green-500"
                            style={{ width: '100%' }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Best possible</span>
                          <span>Free!</span>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle threshold shipping
                  if (threshold && threshold > 0) {
                    const maxRange = 200;
                    const percentage = Math.min((threshold / maxRange) * 100, 100);
                    
                    // Color based on threshold amount
                    let colorClass = 'bg-green-500';
                    let textColorClass = 'text-green-700';
                    if (threshold > 150) {
                      colorClass = 'bg-red-500';
                      textColorClass = 'text-red-700';
                    } else if (threshold > 100) {
                      colorClass = 'bg-orange-500';
                      textColorClass = 'text-orange-700';
                    } else if (threshold > 50) {
                      colorClass = 'bg-yellow-500';
                      textColorClass = 'text-yellow-700';
                    }
                    
                    return (
                      <div>
                        <div className={`text-lg font-bold mb-2 ${textColorClass}`}>
                          ${threshold} free shipping
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${colorClass}`}
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>$0</span>
                          <span>$200+</span>
                        </div>
                      </div>
                    );
                  }
                  
                  // Fallback
                  return <div className="text-sm text-gray-500">Shipping policy not specified</div>;
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

                const brandName = extractBrandName(url);
                const logoUrl = `https://logo.clearbit.com/${url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}`;

                return (
                  <div className="rounded-lg p-6" style={{ backgroundColor: '#FBFAF9' }}>
                    {/* Brand Header with Logo and Save PDF Button */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                      <div className="flex items-center">
                        <img 
                          src={logoUrl}
                          alt={`${brandName} logo`}
                          className="w-12 h-12 mr-4 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900">{brandName}</h1>
                        </div>
                      </div>
                      
                      {/* Save Report Button */}
                      <button
                        onClick={() => handleSaveReport(url, result)}
                        disabled={generatingPdf}
                        className="text-xs text-gray-600 hover:text-gray-800 border border-gray-300 px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingPdf ? 'Generating...' : 'View Report'}
                      </button>
                    </div>
                    
                    {/* 3-Column Header Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Industry</h3>
                        <div 
                          className="text-gray-700"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              // Extract Industry from AI-generated business analysis
                              let industryText = '';
                              
                              if (result.business_analysis) {
                                // Look for "## **Industry**: [TEXT]" pattern
                                const industryMatch = result.business_analysis.match(/##\s*\*\*Industry\*\*:\s*([^\n]+)/i);
                                if (industryMatch) {
                                  industryText = industryMatch[1].trim();
                                } else {
                                  // Try alternative patterns
                                  const altMatch = result.business_analysis.match(/Industry:\s*([^\n]+)/i);
                                  if (altMatch) {
                                    industryText = altMatch[1].trim();
                                  }
                                }
                              }
                              
                              // Try comprehensive data for additional context if AI didn't provide industry
                              if (!industryText) {
                                const userData = result.user_site_data?.comprehensiveData;
                                if (userData?.products) {
                                  const products = userData.products.join(' ').toLowerCase();
                                  if (products.includes('jerky') || products.includes('meat') || products.includes('snack')) {
                                    industryText = 'Food & Beverage - Specialty Foods';
                                  } else if (products.includes('clothing') || products.includes('apparel')) {
                                    industryText = 'Apparel & Fashion';
                                  } else if (products.includes('beauty') || products.includes('cosmetic')) {
                                    industryText = 'Beauty & Personal Care';
                                  } else if (products.includes('home') || products.includes('furniture')) {
                                    industryText = 'Home & Garden';
                                  } else if (products.includes('tech') || products.includes('electronic')) {
                                    industryText = 'Technology & Electronics';
                                  }
                                }
                              }
                              
                              // Final fallback
                              if (!industryText) {
                                industryText = 'eCommerce';
                              }
                              
                              // Clean up formatting
                              return industryText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/[\[\]]/g, '').trim();
                            })()
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Shipping</h3>
                        <UserShippingBar shippingInfo={userShippingInfo} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Website URL</h3>
                        <a 
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {url}
                        </a>
                      </div>
                    </div>

                    {/* Business Analysis Title */}
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Business Analysis</h2>

                    {/* Executive Summary */}
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-6 border-l-4 border-orange-400">
                      <h3 className="font-bold text-gray-900 mb-2">Quick Overview</h3>
                      <div className="text-sm text-gray-700 mb-3">
                        {(() => {
                          // Extract Business Overview from AI-generated business analysis
                          let businessOverview = '';
                          
                          if (result.business_analysis) {
                            // Look for "## **Business Overview**" section
                            const overviewMatch = result.business_analysis.match(/##\s*\*\*Business Overview\*\*\s*\n([^#]+)/i);
                            if (overviewMatch) {
                              businessOverview = overviewMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
                            } else {
                              // Try alternative patterns
                              const altMatch = result.business_analysis.match(/Business Overview\s*\n([^#]+)/i);
                              if (altMatch) {
                                businessOverview = altMatch[1].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
                              }
                            }
                          }
                          
                          // If no AI-generated overview, create from user site data
                          if (!businessOverview && result.user_site_data?.comprehensiveData) {
                            const userData = result.user_site_data.comprehensiveData;
                            const name = userData.business_name || extractBrandName(url);
                            const description = userData.business_description || '';
                            const products = userData.products?.slice(0, 3)?.join(', ') || '';
                            
                            if (description) {
                              businessOverview = `${name} ${description.toLowerCase()}`;
                              if (products) {
                                businessOverview += ` Key products include ${products}.`;
                              }
                            }
                          }
                          
                          // Final fallback
                          if (!businessOverview) {
                            businessOverview = `${extractBrandName(url)} operates in the eCommerce space with a focus on delivering quality products to customers.`;
                          }
                          
                          return businessOverview;
                        })()}
                      </div>
                      
                      {/* Show Full Analysis Toggle */}
                      <details className="mt-3 group">
                        <summary className="text-orange-600 hover:text-orange-700 cursor-pointer font-medium text-sm list-none flex items-center">
                          <span>Show full analysis</span>
                          <span className="ml-1 transition-transform duration-200 group-open:rotate-180">▼</span>
                        </summary>
                        <div className="mt-4 pt-4 border-t border-orange-200">
                          <div 
                            className="text-gray-700 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ 
                              __html: convertMarkdownToHtml(result.business_analysis)
                            }}
                          />
                        </div>
                      </details>
                    </div>


                  </div>
                );
              })()}

              {/* Competitor Analysis */}
              {result.competitors && result.competitors.length > 0 && (() => {
                // Extract threshold and shipping info helper function
                const extractShippingInfo = (competitor: any) => {
                  const comprehensiveData = competitor.comprehensiveData || competitor.businessData;
                  
                  // First try comprehensive data from Firecrawl
                  if (comprehensiveData?.shipping_incentives?.[0]) {
                    const incentive = comprehensiveData.shipping_incentives[0];
                    const amount = incentive.threshold_amount;
                    const policy = incentive.policy || '';
                    
                    // Handle explicit threshold amounts
                    if (amount === 0 || amount === '0' || amount === 0.0) {
                      return { threshold: 0, type: 'free', displayText: policy || 'Free shipping' };
                    }
                    
                    if (typeof amount === 'string') {
                      const match = amount.match(/\$?(\d+(?:\.\d{2})?)/);
                      if (match) {
                        return { threshold: parseFloat(match[1]), type: 'threshold', displayText: `$${match[1]}+ for free shipping` };
                      }
                    }
                    
                    if (typeof amount === 'number' && amount > 0) {
                      return { threshold: amount, type: 'threshold', displayText: `$${amount}+ for free shipping` };
                    }
                    
                    // Check policy text for shipping patterns
                    const lowerPolicy = policy.toLowerCase();
                    if (lowerPolicy.includes('free') && (lowerPolicy.includes('conus') || lowerPolicy.includes('shipping'))) {
                      return { threshold: 0, type: 'free', displayText: policy };
                    }
                    
                    if (lowerPolicy.includes('calculated at checkout') || lowerPolicy.includes('shipping & taxes calculated')) {
                      return { threshold: null, type: 'calculated', displayText: 'Shipping calculated at checkout' };
                    }
                    
                    // If we have policy text but no clear threshold
                    if (policy) {
                      return { threshold: null, type: 'policy', displayText: policy };
                    }
                  }
                  
                  // Try direct threshold if available
                  if (competitor.threshold !== null && competitor.threshold !== undefined) {
                    return { threshold: competitor.threshold, type: 'threshold', displayText: `$${competitor.threshold}+ for free shipping` };
                  }
                  
                  // Legacy fallback
                  const shippingText = competitor.shipping_incentives || competitor.shippingAnalysis || '';
                  if (shippingText) {
                    const lowerShipping = shippingText.toLowerCase();
                    
                    // Check for free shipping mentions
                    if (lowerShipping.includes('free') && (lowerShipping.includes('conus') || lowerShipping.includes('shipping'))) {
                      return { threshold: 0, type: 'free', displayText: 'Free shipping' };
                    }
                    
                    // Check for calculated shipping
                    if (lowerShipping.includes('calculated at checkout') || lowerShipping.includes('shipping & taxes calculated')) {
                      return { threshold: null, type: 'calculated', displayText: 'Shipping calculated at checkout' };
                    }
                    
                    // Try to extract dollar amounts
                    const dollarMatches = shippingText.match(/\$(\d+(?:\.\d{2})?)/g);
                    if (dollarMatches) {
                      const amounts = dollarMatches.map(match => parseFloat(match.replace('$', '')));
                      const commonThresholds = amounts.filter(amt => amt >= 25 && amt <= 300);
                      if (commonThresholds.length > 0) {
                        const threshold = Math.min(...commonThresholds);
                        return { threshold, type: 'threshold', displayText: `$${threshold}+ for free shipping` };
                      }
                    }
                  }
                  
                  // No shipping data found
                  return { threshold: null, type: 'unknown', displayText: 'Shipping policy not specified' };
                };

                const extractThreshold = (competitor: any) => {
                  return extractShippingInfo(competitor).threshold;
                };
                
                // Calculate dynamic range from all competitors using enhanced data
                const allThresholds = result.competitors
                  .map(comp => extractThreshold(comp))
                  .filter(threshold => threshold !== null && threshold !== undefined && threshold >= 0) as number[];
                
                const minThreshold = allThresholds.length > 0 ? Math.min(...allThresholds) : 0;
                const maxThreshold = allThresholds.length > 0 ? Math.max(...allThresholds) : 200;

                return (
                  <div className="rounded-lg p-6" style={{ backgroundColor: '#FBFAF9' }}>
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Competitor Analysis</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {result.competitors.map((competitor, index) => {
                        const shippingInfo = extractShippingInfo(competitor);
                        const threshold = shippingInfo.threshold;
                        
                        // Create threshold visual bar with dynamic scaling
                        const ThresholdBar = ({ shippingInfo }: { shippingInfo: any }) => {
                          if (!shippingInfo) return null;
                          const { threshold, type, displayText } = shippingInfo;
                          
                          // Handle non-threshold cases - don't show shipping policy section for calculated checkout
                          if (type === 'calculated' || type === 'policy' || type === 'unknown') {
                            return null; // Remove shipping policy section entirely
                          }
                          
                          if (threshold === null || threshold === undefined) return null;
                          
                          const range = maxThreshold - minThreshold || 1;
                          const percentage = threshold === 0 ? 0 : ((threshold - minThreshold) / range) * 100;
                          
                          // Special handling for zero threshold (free shipping)
                          if (threshold === 0) {
                            return (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-gray-700">Free shipping threshold</span>
                                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                    FREE
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="h-2.5 rounded-full bg-green-500 transition-all duration-300"
                                    style={{ width: '100%' }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                  <span>Best possible</span>
                                  <span>Free shipping!</span>
                                </div>
                              </div>
                            );
                          }
                          
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
                          
                          return (
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-700">Free shipping threshold</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${threshold === 0 ? 'bg-green-500 text-white' : chipColorClass}`}>
                                  {threshold === 0 ? 'FREE' : `$${threshold}`}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="h-2.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.max(percentage, 5)}%`,
                                    backgroundColor: bgColor
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>${minThreshold}</span>
                                <span>${maxThreshold}</span>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-2">
                              <img 
                                src={`https://logo.clearbit.com/${competitor.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}`}
                                alt={`${competitor.name} logo`}
                                className="w-6 h-6 mr-3 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <h3 className="font-semibold text-lg text-gray-900">{competitor.name}</h3>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">Website:</span>{' '}
                              <a 
                                href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {competitor.website.replace(/^https?:\/\//, '')}
                              </a>
                            </p>
                            
                            <p className="text-sm text-gray-700 mb-3">
                              <span className="font-medium">Products:</span> {competitor.products}
                            </p>

                            <ThresholdBar shippingInfo={shippingInfo} />

                            {/* Enhanced Shipping Information - Expandable */}
                            {(() => {
                              const comprehensiveData = competitor.comprehensiveData || competitor.businessData;
                              const shippingIncentives = comprehensiveData?.shipping_incentives || [];
                              const legacyIncentives = competitor.shipping_incentives || competitor.shippingAnalysis;
                              
                              // Map different data structures to standardized format
                              const normalizedData = comprehensiveData ? {
                                ...comprehensiveData,
                                business_details: comprehensiveData.business_details || {
                                  description: comprehensiveData.business_description || comprehensiveData.business_summary,
                                  mission_statement: comprehensiveData.mission_statement,
                                  target_audience: comprehensiveData.target_audience,
                                  price_range: comprehensiveData.price_range,
                                  unique_selling_points: comprehensiveData.unique_selling_points
                                }
                              } : null;
                              
                              if (shippingIncentives.length > 0) {
                                // Display enhanced shipping data with expandable sections
                                return (
                                  <div className="text-sm space-y-3">
                                    {/* Primary Shipping Policy (Always Visible) */}
                                    <div>
                                      <span className="font-medium text-gray-900">Primary Shipping:</span>
                                      <div className="mt-1">
                                        {shippingIncentives.slice(0, 1).map((incentive, i) => (
                                          <div key={i} className="bg-gray-50 p-2 rounded border-l-2 border-blue-400">
                                            <div className="flex items-center space-x-2 mb-1">
                                              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                                {(() => {
                                                  // First check for free shipping indicators
                                                  if (incentive.threshold_amount === 0 || incentive.threshold_amount === '0') {
                                                    return 'FREE';
                                                  }
                                                  
                                                  // Check policy text for free shipping
                                                  const policyText = incentive.policy?.toLowerCase() || '';
                                                  if (policyText.includes('free shipping') && 
                                                      (policyText.includes('all orders') || policyText.includes('everything') || policyText.includes('always'))) {
                                                    return 'FREE';
                                                  }
                                                  
                                                  // Check for valid threshold amounts
                                                  if (incentive.threshold_amount && 
                                                      incentive.threshold_amount !== 'N/A' && 
                                                      incentive.threshold_amount !== 'null' &&
                                                      !isNaN(Number(incentive.threshold_amount.toString().replace('$', '')))) {
                                                    return `${incentive.threshold_amount.toString().startsWith('$') ? incentive.threshold_amount : '$' + incentive.threshold_amount}+`;
                                                  }
                                                  
                                                  // Only show "AT CHECKOUT" for explicitly calculated shipping
                                                  const isCalculatedAtCheckout = policyText.includes('shipping calculated at checkout') ||
                                                                                policyText.includes('taxes and shipping calculated at checkout') ||
                                                                                policyText.includes('shipping & taxes calculated at checkout');
                                                  
                                                  if (isCalculatedAtCheckout) {
                                                    return 'AT CHECKOUT';
                                                  }
                                                  
                                                  // Default for unclear cases
                                                  return 'NOT SPECIFIED';
                                                })()}
                                              </span>
                                              {/* Remove shipping speed tags as they tend to show N/A */}
                                            </div>
                                            <div className="text-xs text-gray-700">
                                              {incentive.policy || 'Free shipping policy'}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Expandable Details */}
                                    <details className="mt-3">
                                      <summary className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm font-medium flex items-center">
                                        <span>View complete shipping & business details</span>
                                        <svg className="w-4 h-4 ml-1 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </summary>
                                      
                                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-4">
                                        {/* All Shipping Tiers */}
                                        {shippingIncentives.length > 1 && (
                                          <div>
                                            <h4 className="font-medium text-gray-900 mb-2">All Shipping Tiers:</h4>
                                            <div className="space-y-2">
                                              {shippingIncentives.map((incentive, i) => (
                                                <div key={i} className="bg-gray-50 p-2 rounded border-l-2 border-green-400">
                                                  <div className="flex items-center space-x-2 mb-1">
                                                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                                                      {incentive.threshold_amount === 0 || incentive.threshold_amount === '0' ? 
                                                        'FREE' : `${incentive.threshold_amount.toString().startsWith('$') ? incentive.threshold_amount : '$' + incentive.threshold_amount}+`}
                                                    </span>
                                                    <span className="text-xs text-gray-600">
                                                      {incentive.delivery_timeframe || 'Standard delivery'}
                                                    </span>
                                                  </div>
                                                  <div className="text-xs text-gray-700">
                                                    {incentive.policy || 'Free shipping policy'}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Business Intelligence - Mission & Values */}
                                        {(normalizedData?.business_details?.mission_statement || 
                                          normalizedData?.business_details?.description ||
                                          normalizedData?.business_details?.unique_selling_points) && (
                                          <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Business Intelligence:</h4>
                                            <div className="space-y-2">
                                              {normalizedData.business_details?.mission_statement && (
                                                <div className="bg-indigo-50 p-2 rounded border-l-2 border-indigo-400">
                                                  <div className="text-xs font-medium text-indigo-700 mb-1">Mission Statement:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {normalizedData.business_details.mission_statement}
                                                  </div>
                                                </div>
                                              )}
                                              {normalizedData.business_details?.unique_selling_points && (
                                                <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                                                  <div className="text-xs font-medium text-green-700 mb-1">Unique Selling Points:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {Array.isArray(normalizedData.business_details.unique_selling_points) 
                                                      ? normalizedData.business_details.unique_selling_points.join(' • ')
                                                      : normalizedData.business_details.unique_selling_points}
                                                  </div>
                                                </div>
                                              )}
                                              {normalizedData.business_details?.target_audience && (
                                                <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                                                  <div className="text-xs font-medium text-purple-700 mb-1">Target Audience:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {normalizedData.business_details.target_audience}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Pricing & Promotions */}
                                        {(normalizedData?.business_details?.price_range ||
                                          normalizedData?.promotional_content) && (
                                          <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Pricing & Promotions:</h4>
                                            <div className="space-y-2">
                                              {normalizedData.business_details?.price_range && (
                                                <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                                                  <div className="text-xs font-medium text-yellow-700 mb-1">Price Range:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {normalizedData.business_details.price_range}
                                                  </div>
                                                </div>
                                              )}
                                              {normalizedData?.promotional_content && (
                                                <div className="bg-red-50 p-2 rounded border-l-2 border-red-400">
                                                  <div className="text-xs font-medium text-red-700 mb-1">Current Promotions:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {Array.isArray(normalizedData.promotional_content)
                                                      ? normalizedData.promotional_content.slice(0, 3).join(' • ')
                                                      : normalizedData.promotional_content.toString().slice(0, 200) + '...'}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Customer Policies */}
                                        {(normalizedData?.return_policy ||
                                          normalizedData?.customer_service_details) && (
                                          <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Customer Policies:</h4>
                                            <div className="space-y-2">
                                              {normalizedData?.return_policy && (
                                                <div className="bg-orange-50 p-2 rounded border-l-2 border-orange-400">
                                                  <div className="text-xs font-medium text-orange-700 mb-1">Return Policy:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {(() => {
                                                      const policy = normalizedData.return_policy;
                                                      if (Array.isArray(policy)) {
                                                        return policy.join(' • ');
                                                      } else if (typeof policy === 'object' && policy !== null) {
                                                        const parts = [];
                                                        if (policy.return_window) parts.push(`Return Window: ${policy.return_window}`);
                                                        if (policy.return_conditions) parts.push(`Conditions: ${policy.return_conditions}`);
                                                        if (policy.refund_policy) parts.push(`Refund: ${policy.refund_policy}`);
                                                        return parts.length > 0 ? parts.join(' • ') : 'Return policy available';
                                                      } else {
                                                        return String(policy);
                                                      }
                                                    })()}
                                                  </div>
                                                </div>
                                              )}
                                              {normalizedData?.customer_service_details && (
                                                <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                                                  <div className="text-xs font-medium text-blue-700 mb-1">Customer Service:</div>
                                                  <div className="text-xs text-gray-700">
                                                    {typeof normalizedData.customer_service_details === 'object' 
                                                      ? Object.entries(normalizedData.customer_service_details)
                                                          .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
                                                          .join(' • ')
                                                      : normalizedData.customer_service_details}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Shipping & Logistics */}
                                        {normalizedData?.international_shipping && (
                                          <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Shipping & Logistics:</h4>
                                            <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400">
                                              <div className="text-xs font-medium text-purple-700 mb-1">International Shipping:</div>
                                              <div className="text-xs text-gray-700">
                                                {(() => {
                                                  const shipping = normalizedData.international_shipping;
                                                  if (Array.isArray(shipping)) {
                                                    return shipping.join(' • ');
                                                  } else if (typeof shipping === 'object' && shipping !== null) {
                                                    const parts = [];
                                                    Object.entries(shipping).forEach(([key, value]) => {
                                                      if (value) parts.push(`${key.replace(/_/g, ' ')}: ${value}`);
                                                    });
                                                    return parts.length > 0 ? parts.join(' • ') : 'International shipping available';
                                                  } else {
                                                    return String(shipping);
                                                  }
                                                })()}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Show available basic business data when comprehensive data is limited */}
                                        {normalizedData?.business_details?.description && (
                                          <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Business Overview:</h4>
                                            <div className="bg-gray-50 p-2 rounded border-l-2 border-gray-400">
                                              <div className="text-xs text-gray-700">
                                                {normalizedData.business_details.description}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Show message when no comprehensive data is available */}
                                        {!normalizedData && (
                                          <div className="bg-amber-50 p-3 rounded border-l-2 border-amber-400">
                                            <div className="text-xs font-medium text-amber-700 mb-1">Analysis Status:</div>
                                            <div className="text-xs text-gray-700">
                                              Comprehensive business data extraction timed out for this competitor. 
                                              Basic shipping information is still available above.
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </details>
                                  </div>
                                );
                              } else if (legacyIncentives && legacyIncentives !== 'Analysis failed due to timeout') {
                                // Fallback to legacy display with basic expandable
                                return (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">Shipping Incentives:</span>
                                    <div className="mt-1 text-gray-800 space-y-1">
                                      {legacyIncentives.split('\n').slice(0, 2).map((line, i) => {
                                        let cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
                                        if (!cleanLine || cleanLine.endsWith(':**') || cleanLine.endsWith(':')) return null;
                                        const formatLine = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                        const formattedLine = formatLine(cleanLine);
                                        
                                        return (
                                          <div key={i} className="flex items-start">
                                            <span className="text-blue-600 mr-2">•</span>
                                            <span 
                                              className="text-sm"
                                              dangerouslySetInnerHTML={{ __html: formattedLine }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                    
                                    {legacyIncentives.split('\n').length > 2 && (
                                      <details className="mt-2">
                                        <summary className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm font-medium">
                                          Show all shipping details
                                        </summary>
                                        <div className="mt-2 text-gray-800 space-y-1">
                                          {legacyIncentives.split('\n').slice(2).map((line, i) => {
                                            let cleanLine = line.replace(/^[•\-*]\s*/, '').trim();
                                            if (!cleanLine || cleanLine.endsWith(':**') || cleanLine.endsWith(':')) return null;
                                            const formatLine = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                            const formattedLine = formatLine(cleanLine);
                                            
                                            return (
                                              <div key={i} className="flex items-start">
                                                <span className="text-blue-600 mr-2">•</span>
                                                <span 
                                                  className="text-sm"
                                                  dangerouslySetInnerHTML={{ __html: formattedLine }}
                                                />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </details>
                                    )}
                                  </div>
                                );
                              } else {
                                // Show timeout message when no data available
                                return (
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">Shipping Incentives:</span>
                                    <div className="mt-1 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                                      <div className="text-xs text-gray-600">
                                        Analysis failed due to timeout
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Call to Action Card */}
              {result && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mt-8 border border-blue-100">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Ready to Turn These Insights Into Action?
                    </h3>
                    <p className="text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed">
                      Get a personalized action plan with competitive grading, specific shipping recommendations, 
                      and a step-by-step implementation strategy tailored to your business. Our experts will analyze 
                      your position against competitors and provide actionable insights to boost your conversion rates.
                    </p>
                    {actionPlanSent ? (
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-semibold">
                          Email sent to {sentToEmail}
                        </span>
                      </div>
                    ) : !showPasswordPrompt ? (
                      <>
                        <ActionPlanEmailForm onSubmit={handleSendActionPlan} isLoading={sendingActionPlan} user={user} />
                        {!user?.email && (
                          <p className="text-sm text-gray-500 mt-3">
                            Free personalized report delivered to your inbox in minutes
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        {emailSentConfirmation && (
                          <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">
                              Email sent to {actionPlanEmail}
                            </span>
                          </div>
                        )}
                        <PasswordPromptModal 
                          email={actionPlanEmail || ''} 
                          isOpen={showPasswordPrompt}
                          onSubmit={handleCompleteSignup}
                          onSkip={() => {
                            setActionPlanSent(true);
                            setShowPasswordPrompt(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
      
      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      {/* Tokens Required Modal */}
      {showTokensRequiredModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                To run another analysis, you'll need tokens
              </h3>
              <p className="text-gray-600 text-sm">
                Each analysis costs 1 token. Choose a package to continue with unlimited competitor intelligence.
              </p>
            </div>

            {/* Token Products */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 10 Token Package */}
              <div className="border border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors cursor-pointer group">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">10 Tokens</div>
                  <div className="text-3xl font-bold text-orange-500 mb-2">$9.99</div>
                  <div className="text-sm text-gray-600 mb-4">$1.00 per analysis</div>
                  <button
                    onClick={() => {
                      // Handle token purchase - will implement account creation flow
                      setShowTokensRequiredModal(false);
                      window.location.href = '/pricing?product=tokens_10';
                    }}
                    className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-black transition-colors group-hover:bg-orange-500 group-hover:hover:bg-orange-600"
                  >
                    Get Started
                  </button>
                </div>
              </div>

              {/* 30 Token Package */}
              <div className="border-2 border-orange-200 bg-orange-50 rounded-xl p-6 hover:border-orange-300 transition-colors cursor-pointer group relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">30 Tokens</div>
                  <div className="text-3xl font-bold text-orange-500 mb-1">
                    <span className="line-through text-xl text-gray-400 mr-2">$29.99</span>
                    $19.99
                  </div>
                  <div className="text-sm text-gray-600 mb-4">$0.67 per analysis</div>
                  <button
                    onClick={() => {
                      // Handle token purchase - will implement account creation flow
                      setShowTokensRequiredModal(false);
                      window.location.href = '/pricing?product=tokens_30';
                    }}
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            {/* Maybe Later Button */}
            <div className="text-center">
              <button
                onClick={() => setShowTokensRequiredModal(false)}
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}