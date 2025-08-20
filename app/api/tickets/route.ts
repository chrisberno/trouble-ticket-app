import { NextRequest, NextResponse } from 'next/server';
import { getAllTickets, getTicketsByCustomer, createTicket } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    
    const tickets = getTicketsByCustomer(name || undefined, phone || undefined);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
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
    
    const ticket = createTicket({
      title,
      description,
      customerName,
      customerPhone,
      status: 'Open'
    });
    
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}