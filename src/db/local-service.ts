import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Import types only so Webpack doesn't bundle the code
import type { Database as DatabaseType } from 'better-sqlite3';

// --- 1. Database Initialization ---

let dbInstance: DatabaseType | null = null;

// Helper to safely require better-sqlite3
function loadDatabaseDriver(): any {
  // 1. If in Electron Renderer (and nodeIntegration is true)
  if (typeof window !== 'undefined' && (window as any).require) {
    return (window as any).require('better-sqlite3');
  }

  // 2. If in Node.js (SSR or Main Process)
  // We use eval('require') to trick Webpack. 
  // Webpack sees "eval" and ignores the require inside, preventing the bundling error.
  const r = eval('require'); 
  return r('better-sqlite3');
}

function getDbPath() {
  // In development, use local file. 
  return path.resolve('./swiftfee.db'); 
}

function getDB() {
  if (!dbInstance) {
    try {
      const Database = loadDatabaseDriver();
      const dbPath = getDbPath();
      
      // verbose: console.log helps debug SQL queries in the console
            const db = new Database(dbPath, { verbose: console.log });
            dbInstance = db;
            
            // Enable WAL mode for better concurrency and performance
            db.pragma('journal_mode = WAL');
      
            // Create a single flexible table to store all "NoSQL" documents
            db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          collection TEXT NOT NULL,
          id TEXT NOT NULL,
          data TEXT NOT NULL,
          PRIMARY KEY (collection, id)
        );
        CREATE INDEX IF NOT EXISTS idx_collection ON documents(collection);
      `);
      
      console.log('SQLite Database initialized at:', dbPath);
    } catch (err) {
      console.error('Failed to initialize SQLite database:', err);
      throw err;
    }
  }
  return dbInstance!;
}

// --- 2. Firestore-like API Wrapper ---

class DocRef {
  constructor(
    public collectionName: string, 
    public id: string
  ) {}

  private get db() {
    return getDB();
  }

  async set(data: any) {
    const finalData = { ...data, id: this.id };
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (collection, id, data)
      VALUES (?, ?, ?)
    `);
    stmt.run(this.collectionName, this.id, JSON.stringify(finalData));
  }

  async update(data: any) {
    const getStmt = this.db.prepare(`
      SELECT data FROM documents WHERE collection = ? AND id = ?
    `);
    const row = getStmt.get(this.collectionName, this.id) as { data: string } | undefined;

    if (row) {
      const existingData = JSON.parse(row.data);
      const newData = { ...existingData, ...data };
      const updateStmt = this.db.prepare(`
        UPDATE documents SET data = ? WHERE collection = ? AND id = ?
      `);
      updateStmt.run(JSON.stringify(newData), this.collectionName, this.id);
    } else {
      console.warn(`Update failed: Document ${this.collectionName}/${this.id} does not exist.`);
    }
  }

  async delete() {
    const stmt = this.db.prepare(`
      DELETE FROM documents WHERE collection = ? AND id = ?
    `);
    stmt.run(this.collectionName, this.id);
  }
}

class CollectionRef {
  constructor(public collectionName: string) {}

  private get db() {
    return getDB();
  }

  doc(id: string) {
    return new DocRef(this.collectionName, id);
  }

  async add(data: any) {
    const id = data.id || uuidv4();
    const docRef = this.doc(id);
    await docRef.set({ ...data, id });
    return { id };
  }
  
  getAll() {
     const stmt = this.db.prepare(`
      SELECT data FROM documents WHERE collection = ?
    `);
    const rows = stmt.all(this.collectionName) as { data: string }[];
    return rows.map(row => JSON.parse(row.data));
  }

  getDoc(id: string) {
     const stmt = this.db.prepare(`
      SELECT data FROM documents WHERE collection = ? AND id = ?
    `);
    const row = stmt.get(this.collectionName, id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  }

  findOne(field: string, value: any) {
    const allDocs = this.getAll();
    return allDocs.find(doc => doc[field] === value);
  }
}

class WriteBatch {
  private ops: Array<() => Promise<void>> = [];

  update(ref: DocRef, data: any) {
    this.ops.push(() => ref.update(data));
    return this;
  }

  set(ref: DocRef, data: any) {
    this.ops.push(() => ref.set(data));
    return this;
  }

  delete(ref: DocRef) {
    this.ops.push(() => ref.delete());
    return this;
  }

  async commit() {
    const db = getDB();
    const transaction = db.transaction(async () => {
      for (const op of this.ops) {
        await op();
      }
    });
    await transaction();
  }
}

export const db = {
  collection(name: string) {
    return new CollectionRef(name);
  },
  
  batch() {
    return new WriteBatch();
  },

  getRawCollection(name: string) {
      return new CollectionRef(name);
  }
};