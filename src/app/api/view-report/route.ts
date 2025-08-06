import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('HTML report generation request:', body);
    
    const { 
      analysisId,
      websiteUrl,
      businessAnalysis,
      competitors,
      userId
    } = body;

    if (!websiteUrl || !businessAnalysis || !competitors) {
      return NextResponse.json({ error: 'Missing required fields: websiteUrl, businessAnalysis, competitors' }, { status: 400 });
    }

    // Generate HTML report that matches the exact design from the main page
    const htmlContent = generateExactHTML(websiteUrl, businessAnalysis, competitors);
    
    // Only save to database if we have a real analysis ID (not temporary)
    if (analysisId && !analysisId.startsWith('temp-') && userId && userId !== 'guest') {
      const supabaseAdmin = getSupabaseClient();
      const { error: updateError } = await supabaseAdmin
        .from('analysis_history')
        .update({ 
          pdf_url: 'html_report', // Mark as HTML report instead of PDF
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', analysisId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating analysis with HTML report:', updateError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      htmlContent: htmlContent 
    });

  } catch (error) {
    console.error('HTML report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate HTML report' }, { status: 500 });
  }
}

function generateExactHTML(websiteUrl: string, businessAnalysis: string, competitors: any[]): string {
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

  // Convert markdown formatting to HTML exactly like the main page
  const convertMarkdownToHTML = (text: string) => {
    // Simple but effective replacement that matches homepage behavior
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **text** -> <strong>text</strong>
      .replace(/\*(.*?)\*/g, '<em>$1</em>');             // *text* -> <em>text</em>
  };

  // Parse business analysis to extract structured data exactly like the main page
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

  const sections = parseBusinessAnalysis(businessAnalysis);

  // Extract thresholds and sort competitors exactly like main page
  const extractThreshold = (text: string) => {
    const matches = text.match(/\$(\d+)/g);
    return matches ? parseInt(matches[0].replace('$', '')) : null;
  };

  const sortedCompetitors = [...competitors].sort((a, b) => {
    const thresholdA = extractThreshold(a.shipping_incentives || '') || 999;
    const thresholdB = extractThreshold(b.shipping_incentives || '') || 999;
    return thresholdA - thresholdB;
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipping Analysis Report - ${brandName}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body {
          background-color: #FBFAF9;
        }
        
        @media print {
          .print-notice {
            display: none;
          }
        }
      </style>
    </head>
    <body class="min-h-screen" style="background-color: #FBFAF9;">
      <div class="print-notice bg-blue-50 border border-blue-200 rounded-lg p-4 m-4 text-center text-blue-800">
        <strong>💡 Print Tip:</strong> Use your browser's print function (Ctrl+P or Cmd+P) to save this report as a PDF or print it.
      </div>
      
      <!-- Exact copy of the analysis results section from the main page -->
      <div class="max-w-[1152px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div class="rounded-lg p-6" style="background-color: #FBFAF9;">
          <!-- Brand Header with Logo -->
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
          
          <!-- 3-Column Header Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Industry</h3>
              <p class="text-gray-700">
                ${(() => {
                  const industryText = sections['Industry'] || 
                   (businessAnalysis?.includes('Industry:') ? 
                    businessAnalysis.split('Industry:')[1]?.split('\n')[0]?.trim() || 'Not specified' 
                    : 'Not specified');
                  // Clean up any asterisks from industry text and convert to HTML
                  return industryText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*\*/g, '');
                })()}
              </p>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Current Shipping</h3>
              <div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div class="bg-gray-400 h-3 rounded-full transition-all duration-300" style="width: 5%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0</span>
                  <span>$200+</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Website URL</h3>
              <a 
                href="${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-800 underline break-all"
              >
                ${websiteUrl}
              </a>
            </div>
          </div>

          <!-- Business Analysis Title -->
          <h2 class="text-2xl font-bold mb-6 text-gray-900">Business Analysis</h2>

          <!-- Executive Summary -->
          <div class="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-6 border-l-4 border-orange-400">
            <h3 class="font-bold text-gray-900 mb-2">Quick Overview</h3>
            <div class="text-sm text-gray-700">
              ${(() => {
                // Extract key insights from each section for executive summary
                const getKeyInsight = (content: string) => {
                  const firstLine = content.split('\n')[0]?.trim();
                  return firstLine?.length > 10 ? firstLine.substring(0, 80) + '...' : firstLine;
                };
                
                const insights = Object.entries(sections)
                  .filter(([title]) => title !== 'Industry')
                  .slice(0, 3)
                  .map(([title, content]) => {
                    const insight = getKeyInsight(content);
                    // Clean up any remaining asterisks from the insight
                    const cleanInsight = insight.replace(/\*\*/g, '');
                    return `${title}: ${cleanInsight}`;
                  })
                  .join(' • ');
                
                return insights || 'Comprehensive business analysis available below.';
              })()}
            </div>
          </div>

          <!-- Condensed Sections with Collapsible Details -->
          <div class="space-y-4">
            ${Object.entries(sections).length > 0 ? 
              Object.entries(sections).map(([sectionTitle, content]) => {
                if (sectionTitle === 'Industry') return ''; // Skip since it's in header
                
                // Extract key points (first 2 bullet points or lines)
                const lines = content.split('\n').filter(line => line.trim());
                const keyPoints = lines.slice(0, 2);
                const remainingContent = lines.slice(2).join('\n');
                
                return `
                  <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <div class="bg-gray-50 p-4">
                      <h3 class="text-lg font-bold text-black mb-2">
                        ${sectionTitle}
                      </h3>
                      <div class="text-gray-700">
                        ${keyPoints.map((point, index) => {
                          // Convert all markdown to HTML properly
                          const formattedPoint = convertMarkdownToHTML(point.trim());
                          return `<div class="text-sm mb-1 leading-relaxed">${formattedPoint}</div>`;
                        }).join('')}
                      </div>
                      
                      ${remainingContent.trim() ? `
                        <details class="mt-3">
                          <summary class="text-gray-600 hover:text-gray-800 cursor-pointer text-sm font-medium">
                            Show more details
                          </summary>
                          <div class="mt-3 pt-3 border-t border-gray-200 text-gray-700">
                            ${remainingContent.split('\n').map((line, index) => {
                              if (!line.trim()) return '';
                              const formattedLine = convertMarkdownToHTML(line.trim());
                              return `<p class="text-sm mb-1 leading-relaxed">${formattedLine}</p>`;
                            }).join('')}
                          </div>
                        </details>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')
              :
              // Fallback: Show condensed raw business analysis
              `<div class="border border-gray-200 rounded-lg p-4">
                <div class="text-gray-700 leading-relaxed text-sm">
                  ${convertMarkdownToHTML(businessAnalysis.replace(/Industry:.*?\n/i, '').substring(0, 300))}...
                  <details class="mt-3">
                    <summary class="text-orange-600 hover:text-orange-700 cursor-pointer font-medium">
                      Show full analysis →
                    </summary>
                    <div class="mt-3 pt-3 border-t border-gray-200">
                      <div class="whitespace-pre-wrap font-sans text-sm">
                        ${convertMarkdownToHTML(businessAnalysis.replace(/Industry:.*?\n/i, ''))}
                      </div>
                    </div>
                  </details>
                </div>
              </div>`
            }
          </div>
        </div>

        <!-- Competitor Analysis Section -->
        ${competitors && competitors.length > 0 ? `
          <div class="mt-12">
            <h2 class="text-2xl font-bold mb-6 text-gray-900">Competitor Analysis</h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              ${sortedCompetitors.slice(0, 10).map((competitor, index) => {
                const threshold = extractThreshold(competitor.shipping_incentives || '');
                const logoUrl = `https://logo.clearbit.com/${competitor.website}`;
                
                // Color-coded threshold display
                let thresholdColor = 'bg-gray-500';
                let textColor = 'text-gray-700';
                if (threshold !== null) {
                  if (threshold <= 50) {
                    thresholdColor = 'bg-green-500';
                    textColor = 'text-green-700';
                  } else if (threshold <= 75) {
                    thresholdColor = 'bg-yellow-500';
                    textColor = 'text-yellow-700';
                  } else if (threshold <= 100) {
                    thresholdColor = 'bg-orange-500';
                    textColor = 'text-orange-700';
                  } else {
                    thresholdColor = 'bg-red-500';
                    textColor = 'text-red-700';
                  }
                }
                
                // Progress bar visualization
                const maxRange = 200;
                const percentage = threshold ? Math.min((threshold / maxRange) * 100, 100) : 5;
                
                return `
                  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <!-- Competitor Header -->
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center">
                        <img 
                          src="${logoUrl}"
                          alt="${competitor.name} logo"
                          class="w-8 h-8 mr-3 object-contain"
                          onerror="this.style.display='none'"
                        />
                        <div>
                          <h3 class="font-bold text-gray-900">${competitor.name}</h3>
                          <a 
                            href="https://${competitor.website}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            ${competitor.website}
                          </a>
                        </div>
                      </div>
                      
                      <!-- Ranking Badge -->
                      <div class="text-xs px-2 py-1 rounded-full ${index === 0 ? 'bg-green-100 text-green-800' : index === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                        #${index + 1}
                      </div>
                    </div>
                    
                    <!-- Threshold Display -->
                    ${threshold !== null ? `
                      <div class="mb-4">
                        <div class="${textColor} text-lg font-bold mb-2">
                          $${threshold} free shipping
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            class="h-3 rounded-full transition-all duration-300 ${thresholdColor}"
                            style="width: ${Math.max(percentage, 5)}%"
                          ></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-1">
                          <span>$0</span>
                          <span>$200+</span>
                        </div>
                      </div>
                    ` : `
                      <div class="mb-4 text-gray-500 text-sm">
                        Free shipping threshold not found
                      </div>
                    `}
                    
                    <!-- Products -->
                    <div class="mb-4">
                      <h4 class="font-semibold text-gray-900 mb-2">Products</h4>
                      <p class="text-gray-700 text-sm">${competitor.products}</p>
                    </div>
                    
                    <!-- Shipping Details -->
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-2">Shipping Details</h4>
                      <div class="text-gray-700 text-sm space-y-1">
                        ${competitor.shipping_incentives.split('\n').slice(0, 3).map(line => {
                          const cleanLine = line.trim().replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                          return cleanLine ? `<p>${cleanLine}</p>` : '';
                        }).join('')}
                        ${competitor.shipping_incentives.split('\n').length > 3 ? `
                          <details class="mt-2">
                            <summary class="text-blue-600 cursor-pointer text-sm">Show more details</summary>
                            <div class="mt-2 space-y-1">
                              ${competitor.shipping_incentives.split('\n').slice(3).map(line => {
                                const cleanLine = line.trim().replace(/^- /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                return cleanLine ? `<p class="text-sm">${cleanLine}</p>` : '';
                              }).join('')}
                            </div>
                          </details>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}