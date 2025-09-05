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
  notes?: string;
};

// API response uses lowercase field names
type TicketApiResponse = {
  id: number;
  title: string;
  description: string;
  customername: string;
  customerphone: string;
  status: "Open" | "In Progress" | "Closed";
  createdat?: string;
  updatedat?: string;
  notes?: string;
};

function TicketingSystem() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState(searchParams.get("name") || "");
  const [customerPhone, setCustomerPhone] = useState(searchParams.get("phone") || "");
  const [ticketIdLookup, setTicketIdLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<TicketApiResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

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
      
      // Ensure data is an array before setting tickets
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        console.error('API returned non-array data:', data);
        setTickets([]);
      }
      
      // Update form fields with URL params
      setCustomerName(name || "");
      setCustomerPhone(phone || "");
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
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

  const lookupTicketById = async () => {
    if (!ticketIdLookup.trim()) return;
    
    setLookupLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketIdLookup.trim()}`);
      if (response.ok) {
        const ticket = await response.json();
        setLookupResult(ticket);
      } else {
        setLookupResult(null);
        alert(`Ticket #${ticketIdLookup} not found`);
      }
    } catch (error) {
      console.error('Error looking up ticket:', error);
      setLookupResult(null);
      alert('Error looking up ticket');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage customer support requests</p>
      </div>
      
      {/* Quick Ticket Lookup */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm mb-6 p-6 border border-blue-100">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Quick Ticket Lookup
        </h2>
        <p className="text-gray-600 mb-4">Have a ticket number? Get instant status updates!</p>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter ticket number (e.g., 49)"
              value={ticketIdLookup}
              onChange={(e) => setTicketIdLookup(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && lookupTicketById()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
          <button 
            onClick={lookupTicketById}
            disabled={lookupLoading || !ticketIdLookup.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center"
          >
            {lookupLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Track Ticket'
            )}
          </button>
        </div>

        {/* Lookup Result */}
        {lookupResult && (
          <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg text-gray-800">#{lookupResult.id} - {lookupResult.title}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                lookupResult.status === "Open" 
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : lookupResult.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  : "bg-gray-100 text-gray-800 border border-gray-200"
              }`}>
                {lookupResult.status}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{lookupResult.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div><strong>Customer:</strong> {lookupResult.customername}</div>
              <div><strong>Contact:</strong> {lookupResult.customerphone}</div>
              <div><strong>Created:</strong> {lookupResult.createdat ? new Date(lookupResult.createdat).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Updated:</strong> {lookupResult.updatedat ? new Date(lookupResult.updatedat).toLocaleDateString() : 'N/A'}</div>
            </div>
            {lookupResult.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <strong className="text-gray-700">Internal Notes:</strong>
                <p className="text-gray-600 mt-1">{lookupResult.notes}</p>
              </div>
            )}
          </div>
        )}
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