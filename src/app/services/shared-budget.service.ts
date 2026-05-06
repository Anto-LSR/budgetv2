import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData, addDoc, query, where, doc, deleteDoc, orderBy, Timestamp, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Observable, of, from, switchMap, map, combineLatest } from 'rxjs';
import { SharedGroup, SharedExpense, UserProfile, Settlement } from '../models/budget.models';
import { BudgetService } from './budget.service';

@Injectable({
  providedIn: 'root'
})
export class SharedBudgetService {
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);
  private budgetService = inject(BudgetService);

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

  async addSharedExpense(expense: SharedExpense): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expensesRef = collection(this.firestore, 'sharedExpenses');

    // Si l'option est cochée et qu'une catégorie est sélectionnée, on ajoute aussi aux dépenses personnelles
    if (expense.addToPersonalExpenses && expense.personalCategoryId) {
      await this.budgetService.addExpense({
        amount: expense.amount,
        description: `[Partagé] ${expense.title}`,
        date: expense.date,
        categoryId: expense.personalCategoryId,
        userId: expense.paidBy,
        type: 'expense'
      });
    }

    return addDoc(expensesRef, {
      ...expense,
      date: Timestamp.fromDate(new Date(expense.date)),
      createdAt: Timestamp.now()
    });
  }

  getSharedExpense(id: string): Observable<SharedExpense | undefined> {
    if (!isPlatformBrowser(this.platformId)) return of(undefined);
    const expenseRef = doc(this.firestore, `sharedExpenses/${id}`);
    return from(getDoc(expenseRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as SharedExpense;
        }
        return undefined;
      })
    );
  }

  async updateSharedExpense(id: string, expense: Partial<SharedExpense>): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expenseRef = doc(this.firestore, `sharedExpenses/${id}`);

    const updateData: any = { ...expense };
    if (expense.date) {
      updateData.date = Timestamp.fromDate(new Date(expense.date));
    }

    return updateDoc(expenseRef, updateData);
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
      if (expense.type === 'repayment') {
        // Un remboursement : celui qui paie (paidBy) réduit sa dette envers celui qui reçoit (splitBetween[0])
        // Dans notre calcul de balance, paidBy a un crédit, splitBetween a un débit.
        // Si A rembourse B : A paie, donc A+ montant, B reçoit (est dans splitBetween), donc B- montant.
        balance[expense.paidBy] += expense.amount;
        expense.splitBetween.forEach(m => {
          balance[m] -= expense.amount;
        });
      } else {
        // Dépense classique
        // Celui qui a payé a un crédit
        balance[expense.paidBy] += expense.amount;

        // On divise le montant entre les gens concernés
        const share = expense.amount / expense.splitBetween.length;
        expense.splitBetween.forEach(m => {
          balance[m] -= share;
        });
      }
    });

    return balance;
  }

  calculateSettlements(balances: { [key: string]: number }): Settlement[] {
    const settlements: Settlement[] = [];
    const debtors = Object.keys(balances)
      .filter(id => balances[id] < -0.01)
      .sort((a, b) => balances[a] - balances[b]);
    const creditors = Object.keys(balances)
      .filter(id => balances[id] > 0.01)
      .sort((a, b) => balances[b] - balances[a]);

    let d = 0;
    let c = 0;

    const currentBalances = { ...balances };

    while (d < debtors.length && c < creditors.length) {
      const debtorId = debtors[d];
      const creditorId = creditors[c];

      const debtAmount = Math.abs(currentBalances[debtorId]);
      const creditAmount = currentBalances[creditorId];

      const settlementAmount = Math.min(debtAmount, creditAmount);

      if (settlementAmount > 0.01) {
        settlements.push({
          from: debtorId,
          to: creditorId,
          amount: parseFloat(settlementAmount.toFixed(2))
        });
      }

      currentBalances[debtorId] += settlementAmount;
      currentBalances[creditorId] -= settlementAmount;

      if (Math.abs(currentBalances[debtorId]) < 0.01) d++;
      if (Math.abs(currentBalances[creditorId]) < 0.01) c++;
    }

    return settlements;
  }

  async addRepayment(groupId: string, from: string, to: string, amount: number): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expensesRef = collection(this.firestore, 'sharedExpenses');

    return addDoc(expensesRef, {
      groupId,
      title: 'Remboursement',
      amount,
      paidBy: from,
      splitBetween: [to],
      type: 'repayment',
      date: Timestamp.now(),
      createdAt: Timestamp.now()
    });
  }
}
