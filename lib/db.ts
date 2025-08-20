import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'tickets.db'));

// Create tickets table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export type Ticket = {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerPhone: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt?: string;
  updatedAt?: string;
};

export const getAllTickets = (): Ticket[] => {
  const stmt = db.prepare('SELECT * FROM tickets ORDER BY createdAt DESC');
  return stmt.all() as Ticket[];
};

export const getTicketsByCustomer = (name?: string, phone?: string): Ticket[] => {
  if (!name && !phone) return getAllTickets();
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params: Record<string, string> = {};
  
  if (name) {
    query += ' AND customerName LIKE @name';
    params.name = `%${name}%`;
  }
  
  if (phone) {
    query += ' AND customerPhone LIKE @phone';
    params.phone = `%${phone}%`;
  }
  
  query += ' ORDER BY createdAt DESC';
  
  const stmt = db.prepare(query);
  return stmt.all(params) as Ticket[];
};

export const createTicket = (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Ticket => {
  const stmt = db.prepare(`
    INSERT INTO tickets (title, description, customerName, customerPhone, status)
    VALUES (@title, @description, @customerName, @customerPhone, @status)
  `);
  
  const result = stmt.run(ticket);
  return {
    ...ticket,
    id: result.lastInsertRowid as number
  };
};

export const updateTicketStatus = (id: number, status: Ticket['status']): void => {
  const stmt = db.prepare(`
    UPDATE tickets 
    SET status = @status, updatedAt = CURRENT_TIMESTAMP 
    WHERE id = @id
  `);
  
  stmt.run({ id, status });
};

export default db;