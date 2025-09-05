import { sql } from '@vercel/postgres';

// Initialize database table (runs on first query)
async function initDB() {
  try {
    console.log('Initializing database...');
    await sql`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        customerName TEXT NOT NULL,
        customerPhone TEXT NOT NULL,
        status TEXT DEFAULT 'Open',
        notes TEXT DEFAULT '',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Migration: Add notes column if it doesn't exist
    try {
      await sql`ALTER TABLE tickets ADD COLUMN notes TEXT DEFAULT ''`;
      console.log('Notes column migration completed');
    } catch (migrationError) {
      // Column likely already exists, this is expected
      console.log('Notes column already exists:', migrationError instanceof Error ? migrationError.message : migrationError);
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

export type Ticket = {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  status: 'Open' | 'In Progress' | 'Closed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getAllTickets = async (): Promise<Ticket[]> => {
  await initDB();
  const result = await sql`SELECT * FROM tickets ORDER BY createdAt DESC`;
  return result.rows as Ticket[];
};

export const getTicketsByCustomer = async (name?: string, phone?: string): Promise<Ticket[]> => {
  await initDB();
  
  if (!name && !phone) return getAllTickets();
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params: string[] = [];
  
  if (name) {
    query += ` AND customerName ILIKE $${params.length + 1}`;
    params.push(`%${name}%`);
  }
  
  if (phone) {
    query += ` AND customerPhone ILIKE $${params.length + 1}`;
    params.push(`%${phone}%`);
  }
  
  query += ' ORDER BY createdAt DESC';
  
  const result = await sql.query(query, params);
  return result.rows as Ticket[];
};

export const createTicket = async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket> => {
  await initDB();
  
  const result = await sql`
    INSERT INTO tickets (title, description, customerName, customerPhone, status)
    VALUES (${ticket.title}, ${ticket.description}, ${ticket.customerName}, ${ticket.customerPhone}, ${ticket.status})
    RETURNING *
  `;
  
  return result.rows[0] as Ticket;
};

export const getTicketById = async (id: string): Promise<Ticket | null> => {
  await initDB();
  
  const result = await sql`SELECT * FROM tickets WHERE id = ${id}`;
  return result.rows[0] as Ticket || null;
};

export const updateTicketStatus = async (id: string, status: Ticket['status']): Promise<Ticket | null> => {
  await initDB();
  
  const result = await sql`
    UPDATE tickets 
    SET status = ${status}, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ${id}
    RETURNING *
  `;
  
  return result.rows[0] as Ticket || null;
};

export const updateTicketNotes = async (id: string, notes: string): Promise<Ticket | null> => {
  await initDB();
  
  const result = await sql`
    UPDATE tickets 
    SET notes = ${notes}, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = ${id}
    RETURNING *
  `;
  
  return result.rows[0] as Ticket || null;
};