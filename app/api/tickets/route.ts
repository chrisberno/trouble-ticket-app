import { NextRequest, NextResponse } from 'next/server';
import { getTicketsByCustomer, createTicket } from '@/lib/db';

// CORS configuration
const corsOptions = {
  'Access-Control-Allow-Origin': 'https://connie.plus',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true'
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsOptions,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    
    const tickets = await getTicketsByCustomer(name || undefined, phone || undefined);
    return NextResponse.json(tickets, { headers: corsOptions });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { 
      status: 500,
      headers: corsOptions 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, customerName, customerPhone } = body;
    
    if (!title || !description || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const ticket = await createTicket({
      title,
      description,
      customerName,
      customerPhone,
      status: 'Open'
    });
    
    // Trigger TaskRouter webhook (fire and forget - don't wait for response)
    try {
      // Get origin from referrer or query params
      const origin = request.headers.get('referer')?.includes('nss.') ? 'NSS' : 
                    request.headers.get('referer')?.includes('hhovv.') ? 'HHOVV' :
                    request.headers.get('referer')?.includes('devsandbox.') ? 'DevSandBox' : 
                    'Unknown';
      
      // Call our internal webhook endpoint
      fetch(new URL('/api/webhook/taskrouter', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          title: ticket.title,
          description: ticket.description,
          customerName: ticket.customerName,
          customerPhone: ticket.customerPhone,
          origin: origin
        })
      }).catch(err => {
        console.error('Failed to trigger TaskRouter webhook:', err);
        // Don't throw - ticket was created successfully
      });
    } catch (webhookError) {
      console.error('Error triggering webhook:', webhookError);
      // Don't throw - ticket was created successfully
    }
    
    return NextResponse.json(ticket, { 
      status: 201,
      headers: corsOptions 
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { 
      status: 500,
      headers: corsOptions 
    });
  }
}