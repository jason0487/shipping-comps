import { NextRequest, NextResponse } from 'next/server';

interface LeadData {
  email: string;
  name?: string;
  company?: string;
  website_url?: string;
  analysis_data?: any;
  user_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const leadData: LeadData = await request.json();
    
    console.log('Creating HubSpot lead:', leadData);
    
    // Validate required fields
    if (!leadData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const success = await createHubSpotLead(leadData);
    
    if (success) {
      console.log('HubSpot lead created successfully');
      return NextResponse.json({ success: true, message: 'Lead created successfully' });
    } else {
      console.log('HubSpot lead creation failed');
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in HubSpot lead API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

async function createHubSpotLead(leadData: LeadData): Promise<boolean> {
  const hubspotApiKey = process.env.HUBSPOT_API_KEY;
  
  if (!hubspotApiKey) {
    console.log('HubSpot API key not configured');
    return false;
  }

  try {
    // Extract analysis data
    const analysisData = leadData.analysis_data || {};
    const competitors = analysisData.competitors || [];
    const businessAnalysis = analysisData.business_analysis || '';
    
    // Extract company name from website URL if not provided
    let companyName = leadData.company || '';
    if (!companyName && leadData.website_url) {
      companyName = leadData.website_url
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('.')[0];
    }

    // Extract industry from business analysis
    let industry = 'E-commerce';
    if (businessAnalysis.includes('Industry:')) {
      const industryMatch = businessAnalysis.match(/Industry:\s*([^\n]+)/i);
      if (industryMatch) {
        industry = industryMatch[1].trim();
      }
    }

    // Format analysis date
    const analysisDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create HubSpot contact
    const contactData = {
      properties: {
        email: leadData.email,
        firstname: leadData.name || leadData.email.split('@')[0],
        company: companyName,
        website: leadData.website_url || '',
        lifecyclestage: 'lead',
        hs_lead_status: 'NEW',
        source: 'Shipping Comps Analysis',
        hs_analytics_source: 'OFFLINE',
        // Custom properties for competitor analysis
        competitor_count: competitors.length.toString(),
        analysis_timestamp: analysisDate,
        industry_segment: industry,
        lead_quality_score: competitors.length >= 5 ? 'High' : 'Medium',
        follow_up_priority: 'High'
      }
    };

    console.log('Sending contact data to HubSpot:', contactData);

    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hubspotApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('HubSpot contact created:', result.id);
      
      // Try to add to list (optional - won't fail if this doesn't work)
      try {
        await addContactToList(result.id, '27', hubspotApiKey);
      } catch (listError) {
        console.log('Failed to add to list (non-critical):', listError);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('HubSpot API error:', response.status, errorText);
      return false;
    }

  } catch (error) {
    console.error('Error creating HubSpot lead:', error);
    return false;
  }
}

async function addContactToList(contactId: string, listId: string, apiKey: string): Promise<void> {
  try {
    const response = await fetch(`https://api.hubapi.com/contacts/v1/lists/${listId}/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vids: [contactId]
      })
    });

    if (response.ok) {
      console.log(`Added contact ${contactId} to list ${listId}`);
    } else {
      const errorText = await response.text();
      console.log(`Failed to add to list: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.log('Error adding contact to list:', error);
  }
}