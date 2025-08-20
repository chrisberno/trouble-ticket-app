"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Ticket = {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  status: "Open" | "In Progress" | "Closed";
  createdAt?: string;
  updatedAt?: string;
};

function TicketingSystem() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState(searchParams.get("name") || "");
  const [customerPhone, setCustomerPhone] = useState(searchParams.get("phone") || "");

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    try {
      const phone = searchParams.get("phone");
      const name = searchParams.get("name");
      
      const params = new URLSearchParams();
      if (phone) params.append('phone', phone);
      if (name) params.append('name', name);
      
      const response = await fetch(`/api/tickets?${params}`);
      const data = await response.json();
      setTickets(data);
      
      // Update form fields with URL params
      setCustomerName(name || "");
      setCustomerPhone(phone || "");
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTickets();
  }, [searchParams, fetchTickets]);

  const createTicket = async () => {
    if (!title || !description || !customerName || !customerPhone) return;
    
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          customerName,
          customerPhone
        })
      });
      
      if (response.ok) {
        setTitle("");
        setDescription("");
        await fetchTickets(); // Refresh tickets list
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const updateStatus = async (id: number, newStatus: Ticket["status"]) => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        await fetchTickets(); // Refresh tickets list
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage customer support requests</p>
      </div>
      
      {/* Create Ticket Form */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New Ticket</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Detailed description of the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                type="text"
                placeholder="+1 (555) 123-4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
          <button 
            onClick={createTicket} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Create Ticket
          </button>
        </div>
      </div>
      
      {/* Ticket List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Tickets {tickets.length > 0 && <span className="text-gray-500 text-base font-normal">({tickets.length})</span>}
        </h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No tickets found</p>
            <p className="text-sm mt-1">Create a ticket to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">#{ticket.id} - {ticket.title}</h3>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatus(ticket.id, e.target.value as Ticket["status"])}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      ticket.status === "Open" 
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200" 
                        : ticket.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    }`}
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Closed</option>
                  </select>
                </div>
                <p className="text-gray-600 mb-3">{ticket.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">Customer:</span>
                  <span className="ml-2">{ticket.customerName}</span>
                  <span className="mx-2">•</span>
                  <span>{ticket.customerPhone}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
      <TicketingSystem />
    </Suspense>
  );
}