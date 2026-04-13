'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  ClientRequest,
  ClientRequestItem,
  AddItemPayload,
  SubmitRequestPayload,
} from '@/lib/types/marketplace';

interface UseClientRequestState {
  request: ClientRequest | null;
  items: ClientRequestItem[];
  isLoading: boolean;
  error: string | null;
}

interface UseClientRequestActions {
  fetchRequest: () => Promise<void>;
  addItem: (item: AddItemPayload) => Promise<ClientRequestItem | null>;
  updateItem: (itemId: string, data: Partial<AddItemPayload & { client_note: string }>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  submitRequest: (data: SubmitRequestPayload) => Promise<boolean>;
  uploadImage: (file: File) => Promise<string | null>;
}

export function useClientRequest(publicUuid: string): UseClientRequestState & UseClientRequestActions {
  const [request, setRequest] = useState<ClientRequest | null>(null);
  const [items, setItems] = useState<ClientRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    if (!publicUuid) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/client-requests/${publicUuid}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Erreur de chargement');
        return;
      }

      setRequest(json.data);
      setItems(json.data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [publicUuid]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const addItem = useCallback(async (item: AddItemPayload): Promise<ClientRequestItem | null> => {
    try {
      const res = await fetch(`/api/client-requests/${publicUuid}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return null;
      }

      setItems(prev => [...prev, json.data]);
      return json.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [publicUuid]);

  const updateItem = useCallback(async (itemId: string, data: Partial<AddItemPayload & { client_note: string }>) => {
    try {
      const res = await fetch(`/api/client-requests/${publicUuid}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === itemId ? json.data : i));
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [publicUuid]);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const res = await fetch(`/api/client-requests/${publicUuid}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId));
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [publicUuid]);

  const submitRequest = useCallback(async (data: SubmitRequestPayload): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/client-requests/${publicUuid}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return false;
      }

      setRequest(json.data);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [publicUuid]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'client-request-images');

      const res = await fetch('/api/public/upload-image', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        return null;
      }

      return json.url || json.data?.url || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    request,
    items,
    isLoading,
    error,
    fetchRequest,
    addItem,
    updateItem,
    deleteItem,
    submitRequest,
    uploadImage,
  };
}
