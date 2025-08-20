import { NextRequest, NextResponse } from 'next/server';

// This endpoint will be called by the ticket creation to trigger TaskRouter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, title, description, customerName, customerPhone, origin } = body;
    
    // Get Twilio credentials from environment variables
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_RTC_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_RTC_AUTH_TOKEN;
    const STUDIO_FLOW_URL = process.env.TWILIO_STUDIO_FLOW_WEBHOOK_URL;
    
    if (!STUDIO_FLOW_URL) {
      console.error('TWILIO_STUDIO_FLOW_WEBHOOK_URL not configured');
      // Don't fail the request - ticket was created successfully
      return NextResponse.json({ 
        success: true, 
        warning: 'TaskRouter integration not configured' 
      });
    }
    
    // Prepare the payload for Studio Flow
    const studioPayload = {
      ticketId: ticketId,
      title: title,
      description: description,
      customerName: customerName,
      customerPhone: customerPhone,
      origin: origin || 'Unknown', // Which account submitted (NSS, HHOVV, etc)
      channel: 'support-ticket',
      priority: determinePriority(title, description),
      timestamp: new Date().toISOString()
    };
    
    // Call the Studio Flow webhook
    const response = await fetch(STUDIO_FLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
      },
      body: JSON.stringify(studioPayload)
    });
    
    if (!response.ok) {
      console.error('Failed to trigger Studio Flow:', await response.text());
      // Don't fail the request - ticket was created successfully
      return NextResponse.json({ 
        success: true, 
        warning: 'Failed to notify support team' 
      });
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      taskCreated: true,
      executionSid: result.sid
    });
    
  } catch (error) {
    console.error('Error triggering TaskRouter:', error);
    // Don't fail the request - ticket was created successfully
    return NextResponse.json({ 
      success: true, 
      warning: 'Failed to notify support team',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to determine priority based on keywords
function determinePriority(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  
  if (content.includes('urgent') || content.includes('emergency') || content.includes('down')) {
    return 'high';
  }
  if (content.includes('bug') || content.includes('error') || content.includes('broken')) {
    return 'medium';
  }
  return 'low';
}