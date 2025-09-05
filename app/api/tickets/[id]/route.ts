import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicketStatus, updateTicketNotes } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticket = await getTicketById(id);
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;
    
    let ticket;
    
    if (status && notes !== undefined) {
      return NextResponse.json({ error: 'Cannot update status and notes in the same request' }, { status: 400 });
    }
    
    if (status) {
      ticket = await updateTicketStatus(id, status);
    } else if (notes !== undefined) {
      ticket = await updateTicketNotes(id, notes);
    } else {
      return NextResponse.json({ error: 'Either status or notes is required' }, { status: 400 });
    }
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
