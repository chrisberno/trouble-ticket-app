import { NextRequest, NextResponse } from 'next/server';

// This endpoint will be called by the ticket creation to trigger TaskRouter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, title, description, customerName, customerPhone, origin } = body;
    
    // Get Twilio credentials from environment variables
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_RTC_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_RTC_AUTH_TOKEN;
    
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error('Twilio credentials not configured');
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
    
    // Call TaskRouter API directly (more reliable than Studio Flow)
    const taskRouterUrl = `https://taskrouter.twilio.com/v1/Workspaces/WSfe43abb4378f0f1e2ebb98877c03bd1d/Tasks`;
    const taskPayload = new URLSearchParams({
      'WorkflowSid': 'WW2c597b1d5a96635b6cb0b6d261c9ede8',
      'TaskChannel': 'default',
      'Attributes': JSON.stringify({
        type: 'support-ticket',
        ticketId: ticketId,
        title: title,
        description: description,
        customerName: customerName,
        customerPhone: customerPhone,
        origin: origin,
        priority: priority,
        timestamp: new Date().toISOString(),
        channel: 'support-ticket'
      })
    });

    const response = await fetch(taskRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
      },
      body: taskPayload.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create TaskRouter task:', errorText);
      // Don't fail the request - ticket was created successfully
      return NextResponse.json({ 
        success: true, 
        warning: 'Failed to notify support team',
        error: errorText
      });
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      taskCreated: true,
      taskSid: result.sid,
      taskStatus: result.assignment_status
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