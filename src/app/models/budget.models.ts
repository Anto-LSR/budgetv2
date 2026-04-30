export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
  userId: string;
  isSystem?: boolean;
}

export interface Expense {
  id?: string;
  amount: number;
  description: string;
  date: any; // Timestamp Firebase
  categoryId: string;
  userId: string;
  isFixedCharge?: boolean;
  type?: 'expense' | 'income';
}

export interface FixedCharge {
  id?: string;
  amount: number;
  description: string;
  categoryId: string;
  userId: string;
}

export interface Subscription {
  id?: string;
  amount: number;
  description: string;
  categoryId: string;
  userId: string;
  isPaused: boolean;
}

export interface Salary {
  id?: string;
  amount: number;
  month: number;
  year: number;
  userId: string;
}
