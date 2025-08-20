import { NextRequest, NextResponse } from 'next/server';
import { updateTicketStatus } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await request.json();
    const { status } = body;
    
    if (!status || !['Open', 'In Progress', 'Closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    updateTicketStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}