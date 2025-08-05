import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { testUrls } = await request.json();
    const urls = testUrls || ['https://patagonia.com', 'https://adidas.com', 'https://warbyparker.com'];
    const userId = 'efd3cdfe-2484-4108-aebb-cbddc36af47c'; // Test user
    
    console.log('=== RELIABILITY TEST STARTED ===');
    console.log(`Testing ${urls.length} URLs for analysis reliability...`);
    
    const results = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n--- Testing ${i + 1}/${urls.length}: ${url} ---`);
      
      const startTime = Date.now();
      
      try {
        const response = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, userId }),
          signal: AbortSignal.timeout(120000) // 2 minute timeout for full analysis
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            url,
            success: true,
            duration: Math.round(duration / 1000) + 's',
            competitorCount: data.competitors?.length || 0,
            hasBusinessAnalysis: !!data.business_analysis,
            analysisId: data.analysis_id
          });
          console.log(`✅ ${url} - SUCCESS (${Math.round(duration / 1000)}s)`);
        } else {
          const errorData = await response.json();
          results.push({
            url,
            success: false,
            duration: Math.round(duration / 1000) + 's',
            error: errorData.error,
            status: response.status
          });
          console.log(`❌ ${url} - FAILED (${response.status}: ${errorData.error})`);
        }
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        results.push({
          url,
          success: false,
          duration: Math.round(duration / 1000) + 's',
          error: error.message,
          type: 'network_error'
        });
        console.log(`❌ ${url} - NETWORK ERROR: ${error.message}`);
      }
      
      // Add delay between tests to prevent overwhelming the API
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const successRate = Math.round((successCount / results.length) * 100);
    
    console.log('\n=== RELIABILITY TEST COMPLETE ===');
    console.log(`Success Rate: ${successCount}/${results.length} (${successRate}%)`);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      testType: 'analysis_reliability',
      summary: {
        totalTests: results.length,
        successful: successCount,
        failed: results.length - successCount,
        successRate: successRate
      },
      results,
      recommendation: successRate >= 80 ? 'System performing well' : 
                     successRate >= 60 ? 'Minor improvements needed' :
                     'Significant reliability issues detected'
    });
    
  } catch (error) {
    console.error('Reliability test error:', error);
    return NextResponse.json({
      error: 'Reliability test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}