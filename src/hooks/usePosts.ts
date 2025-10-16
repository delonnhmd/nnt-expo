import { useCallback, useState } from 'react';
import { useBackend } from './useBackend';

async function json(baseUrl: string, path: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  const txt = await res.text();
  const j = txt ? JSON.parse(txt) : null;
  if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
  return j;
}

type Post = {
  id?: number | string;
  topicId?: string;
  category?: string;
  content?: string;
  author?: string;
  createdAt?: number;
};

export function usePosts() {
  const backend = useBackend();
  const [mine, setMine] = useState<Post[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const create = useCallback(async (payload: { topicId?: string; category?: string; content?: string; address?: string; sig?: string }) => {
    const body = {
      topicId: payload.topicId,
      category: payload.category,
      content: payload.content,
      address: payload.address,
      sig: payload.sig,
    };
    try {
      return await json(backend.backendUrl, '/posts', { method: 'POST', body: JSON.stringify(body) });
    } catch (e) {
      // fallback to legacy /submit which the Flask app exposes (moderation + tx build)
      try {
        const sub = {
          from: payload.address,
          postId: Math.floor(Math.random() * 1e9),
          title: payload.topicId,
          cid: null,
          adult: false,
        } as any;
        return await json(backend.backendUrl, '/submit', { method: 'POST', body: JSON.stringify(sub) });
      } catch (e2) {
        throw e; // propagate original error
      }
    }
  }, [backend.backendUrl]);

  const loadMine = useCallback(async (address?: string) => {
    if (!address) return setMine([]);
    setLoading(true);
    try {
      const res = await json(backend.backendUrl, `/posts/mine?address=${encodeURIComponent(address)}`);
      const list = Array.isArray(res) ? res : res.posts ?? [];
      setMine(list);
      return res;
    } finally {
      setLoading(false);
    }
  }, [backend.backendUrl]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await json(backend.backendUrl, '/posts/feed');
      const list = Array.isArray(res) ? res : res.posts ?? [];
      setFeed(list);
      return res;
    } finally {
      setLoading(false);
    }
  }, [backend.backendUrl]);

  return { mine, feed, loading, create, loadMine, loadFeed } as const;
}
