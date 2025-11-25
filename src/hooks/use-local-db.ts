import { useState, useEffect } from 'react';
import { db } from '@/db/local-service';

// A simple hook that fetches data on mount.
// In a real app, you might want to add an event emitter to local-service.ts
// to trigger re-fetches whenever data changes.

export function useLocalCollection<T = any>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch data
  const fetchData = () => {
    try {
      const collection = db.getRawCollection(collectionName);
      const docs = collection.getAll();
      setData(docs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Polling interval to simulate real-time updates (since SQLite is passive)
    // A better approach for production is implementing an Event Emitter in local-service
    const interval = setInterval(fetchData, 2000); 

    return () => clearInterval(interval);
  }, [collectionName]);

  return { data, isLoading };
}

export function useLocalDoc<T = any>(collectionName: string, docId: string) {
  const [data, setData] = useState<T | null>(null);
  
  const fetchData = () => {
      const collection = db.getRawCollection(collectionName);
      const doc = collection.getDoc(docId);
      setData(doc);
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [collectionName, docId]);

  return { data };
}