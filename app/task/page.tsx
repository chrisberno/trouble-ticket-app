'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

// Remove unused interface - task props come from URL search params

interface Ticket {
  id: string;
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function TaskPageContent() {
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Get parameters from URL
  const ticketId = searchParams.get('ticketId');
  const customerName = searchParams.get('customerName');
  const customerPhone = searchParams.get('customerPhone');
  const origin = searchParams.get('origin');
  const title = searchParams.get('title');
  const priority = searchParams.get('priority');

  useEffect(() => {
    if (ticketId) {
      fetchTicket(ticketId);
    } else {
      setError('No ticket ID provided');
      setLoading(false);
    }
  }, [ticketId]);

  const fetchTicket = async (id: string) => {
    try {
      const response = await fetch(`/api/tickets/${id}`);
      if (response.ok) {
        const ticketData = await response.json();
        setTicket(ticketData);
        setNewStatus(ticketData.status);
      } else {
        setError('Ticket not found');
      }
    } catch {
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async () => {
    if (!ticket || !newStatus) return;

    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
        alert('Ticket status updated successfully');
      } else {
        alert('Failed to update ticket status');
      }
    } catch {
      alert('Error updating ticket status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Task Context from Flex:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Ticket ID:</strong> {ticketId || 'Not provided'}</p>
              <p><strong>Customer:</strong> {customerName || 'Not provided'}</p>
              <p><strong>Phone:</strong> {customerPhone || 'Not provided'}</p>
              <p><strong>Origin:</strong> {origin || 'Not provided'}</p>
              <p><strong>Title:</strong> {title || 'Not provided'}</p>
              <p><strong>Priority:</strong> {priority || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Support Ticket: {ticket?.title}</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                ticket?.status === 'Open' ? 'bg-green-100 text-green-800' :
                ticket?.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ticket?.status}
              </span>
              <span className="text-sm text-gray-500">From {origin}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Customer</p>
              <p className="font-medium">{ticket?.customerName}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-medium">{ticket?.customerPhone}</p>
            </div>
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium">{ticket ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{ticket?.description}</p>
          </div>
        </div>

        {/* Agent Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Agent Actions</h2>
          
          {/* Status Update */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status
            </label>
            <div className="flex items-center space-x-4">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              <button
                onClick={updateTicketStatus}
                disabled={newStatus === ticket?.status}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
            </div>
          </div>

          {/* Add Reply/Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Internal Note
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add internal notes about this ticket..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            <button
              onClick={() => {
                // TODO: Implement reply functionality
                alert('Reply functionality coming soon!');
              }}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <TaskPageContent />
    </Suspense>
  );
}