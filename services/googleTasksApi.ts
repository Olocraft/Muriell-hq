import { auth, googleProvider } from './firebase';
import { signInWithPopup, User, GoogleAuthProvider } from 'firebase/auth';

let cachedAccessToken: string | null = null;

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Google Tasks API methods
export const fetchGoogleTasks = async (accessToken: string) => {
  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) throw new Error('Failed to fetch task lists');
  const listData = await listRes.json();
  const lists = listData.items || [];
  
  const allTasks = [];
  for (const list of lists) {
    const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (taskRes.ok) {
      const taskData = await taskRes.json();
      if (taskData.items) {
        allTasks.push(...taskData.items);
      }
    }
  }
  return allTasks;
};

export const createGoogleTask = async (accessToken: string, title: string, notes?: string, due?: string) => {
  // We need to fetch the default list first or just insert into "@default"
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title,
      notes,
      due
    })
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
};
