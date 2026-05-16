
import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp
} from 'firebase/firestore';
import { Task, UserStats, HabitSection } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanData(obj: any): any {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Timestamp)) {
        cleaned[key] = cleanData(value);
      } else {
        cleaned[key] = value;
      }
    }
  });
  return cleaned;
}

export const taskService = {
  async syncUserData(userId: string, data: { 
    tasks?: Task[], 
    stats?: UserStats, 
    habitSections?: HabitSection[], 
    routine?: string | null,
    photoURL?: string,
    readingHistory?: { title: string, timestamp: string }[],
    consistencyHistory?: { date: string, score: number }[]
  }) {
    const path = `app_users/${userId}`;
    try {
      const userRef = doc(db, 'app_users', userId);
      const cleaned = cleanData({ ...data, lastSeen: Timestamp.now() });
      await setDoc(userRef, cleaned, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserData(userId: string): Promise<{ 
    tasks?: Task[], 
    stats?: UserStats, 
    habitSections?: HabitSection[], 
    routine?: string | null, 
    lastRefreshDate?: string,
    photoURL?: string,
    readingHistory?: { title: string, timestamp: string }[],
    consistencyHistory?: { date: string, score: number }[]
  } | null> {
    const path = `app_users/${userId}`;
    try {
      const userRef = doc(db, 'app_users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data() as any;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async checkDailyRefresh(userId: string, currentTasks: Task[], currentHabits: HabitSection[]): Promise<{ tasks: Task[], habits: HabitSection[] }> {
    const path = `app_users/${userId}`;
    try {
      const userRef = doc(db, 'app_users', userId);
      const userSnap = await getDoc(userRef);
      const today = new Date().toISOString().split('T')[0];
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const lastRefresh = data.lastRefreshDate;
        
        if (lastRefresh !== today) {
          const refreshedTasks = currentTasks.map(task => {
            if (task.status === 'pending') {
              return { ...task, status: 'missed' as const, alarmTriggered: false };
            }
            return task;
          });

          const refreshedHabits = currentHabits.map(section => ({
            ...section,
            habits: section.habits.map(habit => ({
              ...habit,
              completed: false,
              alarmTriggered: false
            }))
          }));
          
          await updateDoc(userRef, { 
            tasks: refreshedTasks,
            habitSections: refreshedHabits,
            lastRefreshDate: today 
          });
          return { tasks: refreshedTasks, habits: refreshedHabits };
        }
      } else {
        await setDoc(userRef, { lastRefreshDate: today }, { merge: true });
      }
      
      return { tasks: currentTasks, habits: currentHabits };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
