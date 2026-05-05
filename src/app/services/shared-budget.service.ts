import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData, addDoc, query, where, doc, deleteDoc, orderBy, Timestamp, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Observable, of, from, switchMap, map, combineLatest } from 'rxjs';
import { SharedGroup, SharedExpense, UserProfile } from '../models/budget.models';

@Injectable({
  providedIn: 'root'
})
export class SharedBudgetService {
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  // Groupes
  getGroups(userId: string): Observable<SharedGroup[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const groupsRef = collection(this.firestore, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', userId), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<SharedGroup[]>;
  }

  getGroup(groupId: string): Observable<SharedGroup | undefined> {
    if (!isPlatformBrowser(this.platformId)) return of(undefined);
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return from(getDoc(groupRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as SharedGroup;
        }
        return undefined;
      })
    );
  }

  createGroup(name: string, userId: string): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const groupsRef = collection(this.firestore, 'groups');
    return addDoc(groupsRef, {
      name,
      members: [userId],
      createdBy: userId,
      createdAt: Timestamp.now()
    });
  }

  joinGroup(groupId: string, userId: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const groupRef = doc(this.firestore, `groups/${groupId}`);
    return updateDoc(groupRef, {
      members: arrayUnion(userId)
    });
  }

  // Dépenses partagées
  getSharedExpenses(groupId: string): Observable<SharedExpense[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const expensesRef = collection(this.firestore, 'sharedExpenses');
    const q = query(expensesRef, where('groupId', '==', groupId), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<SharedExpense[]>;
  }

  addSharedExpense(expense: SharedExpense): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expensesRef = collection(this.firestore, 'sharedExpenses');
    return addDoc(expensesRef, {
      ...expense,
      date: Timestamp.fromDate(new Date(expense.date)),
      createdAt: Timestamp.now()
    });
  }

  deleteSharedExpense(id: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expenseRef = doc(this.firestore, `sharedExpenses/${id}`);
    return deleteDoc(expenseRef);
  }

  // Utilisateurs (pour afficher les noms dans les groupes)
  // On suppose qu'il y a une collection 'users' ou on récupère les infos via l'auth si possible
  // Dans cet exemple, on va créer une méthode simple pour récupérer les profils
  getUserProfile(userId: string): Observable<UserProfile | undefined> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return from(getDoc(userRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        }
        return undefined;
      })
    );
  }

  // Pour Tricount, on a besoin de calculer l'équilibre
  calculateBalance(members: string[], expenses: SharedExpense[]): { [key: string]: number } {
    const balance: { [key: string]: number } = {};
    members.forEach(m => balance[m] = 0);

    expenses.forEach(expense => {
      // Celui qui a payé a un crédit
      balance[expense.paidBy] += expense.amount;

      // On divise le montant entre les gens concernés
      const share = expense.amount / expense.splitBetween.length;
      expense.splitBetween.forEach(m => {
        balance[m] -= share;
      });
    });

    return balance;
  }
}
