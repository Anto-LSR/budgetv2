import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData, addDoc, query, where, doc, deleteDoc, orderBy, Timestamp, getDocs, updateDoc, writeBatch } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Category, Expense, FixedCharge, Salary, Subscription } from '../models/budget.models';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  // Catégories
  getCategories(userId: string): Observable<Category[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const categoriesRef = collection(this.firestore, 'categories');
    const q = query(categoriesRef, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Category[]>;
  }

  addCategory(category: Category) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const categoriesRef = collection(this.firestore, 'categories');
    return addDoc(categoriesRef, category);
  }

  async ensureDefaultCategories(userId: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    const categoriesRef = collection(this.firestore, 'categories');
    const defaultCategories = [
      { name: 'Frais fixes', color: '#64748b', icon: 'lock', isSystem: true },
      { name: 'Crédits', color: '#ef4444', icon: 'credit-card', isSystem: true },
      { name: 'Revenu Complémentaire', color: '#10b981', icon: 'plus-circle', isSystem: true }
    ];

    for (const cat of defaultCategories) {
      const q = query(categoriesRef, where('userId', '==', userId), where('name', '==', cat.name));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await this.addCategory({ ...cat, userId });
      }
    }
  }

  // Dépenses
  getExpenses(userId: string): Observable<Expense[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const expensesRef = collection(this.firestore, 'expenses');
    const q = query(expensesRef, where('userId', '==', userId), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }

  getExpensesByMonth(userId: string, month: number, year: number): Observable<Expense[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const expensesRef = collection(this.firestore, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<=', Timestamp.fromDate(endOfMonth)),
      orderBy('date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }

  getExpensesByYear(userId: string, year: number): Observable<Expense[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const expensesRef = collection(this.firestore, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startOfYear)),
      where('date', '<=', Timestamp.fromDate(endOfYear)),
      orderBy('date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }

  addExpense(expense: Expense) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expensesRef = collection(this.firestore, 'expenses');
    return addDoc(expensesRef, {
      ...expense,
      type: expense.type || 'expense',
      date: Timestamp.fromDate(new Date(expense.date))
    });
  }

  deleteExpense(id: string) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const expenseDocRef = doc(this.firestore, `expenses/${id}`);
    return deleteDoc(expenseDocRef);
  }

  // Frais fixes
  getFixedCharges(userId: string): Observable<FixedCharge[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const chargesRef = collection(this.firestore, 'fixedCharges');
    const q = query(chargesRef, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<FixedCharge[]>;
  }

  addFixedCharge(charge: FixedCharge) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const chargesRef = collection(this.firestore, 'fixedCharges');
    return addDoc(chargesRef, charge);
  }

  deleteFixedCharge(id: string) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const chargeDocRef = doc(this.firestore, `fixedCharges/${id}`);
    return deleteDoc(chargeDocRef);
  }

  updateFixedCharge(id: string, charge: Partial<FixedCharge>) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const chargeDocRef = doc(this.firestore, `fixedCharges/${id}`);
    return updateDoc(chargeDocRef, charge as any);
  }

  // Abonnements
  getSubscriptions(userId: string): Observable<Subscription[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const subscriptionsRef = collection(this.firestore, 'subscriptions');
    const q = query(subscriptionsRef, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Subscription[]>;
  }

  addSubscription(subscription: Subscription) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const subscriptionsRef = collection(this.firestore, 'subscriptions');
    return addDoc(subscriptionsRef, subscription);
  }

  deleteSubscription(id: string) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const subscriptionDocRef = doc(this.firestore, `subscriptions/${id}`);
    return deleteDoc(subscriptionDocRef);
  }

  updateSubscription(id: string, subscription: Partial<Subscription>) {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();
    const subscriptionDocRef = doc(this.firestore, `subscriptions/${id}`);
    return updateDoc(subscriptionDocRef, subscription as any);
  }

  // Salaires
  getSalaryByMonth(userId: string, month: number, year: number): Observable<Salary[]> {
    if (!isPlatformBrowser(this.platformId)) return of([]);
    const salariesRef = collection(this.firestore, 'salaries');
    const q = query(
      salariesRef,
      where('userId', '==', userId),
      where('month', '==', month),
      where('year', '==', year)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Salary[]>;
  }

  async setSalary(salary: Salary) {
    if (!isPlatformBrowser(this.platformId)) return;
    const salariesRef = collection(this.firestore, 'salaries');

    const q = query(
      salariesRef,
      where('userId', '==', salary.userId),
      where('month', '==', salary.month),
      where('year', '==', salary.year)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      const salaryDocRef = doc(this.firestore, `salaries/${existingDoc.id}`);
      const { id, ...salaryData } = salary;
      return updateDoc(salaryDocRef, salaryData as any);
    } else {
      return addDoc(salariesRef, salary);
    }
  }

  async applyFixedCharges(userId: string, month: number, year: number) {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // 1. Récupérer toutes les dépenses du mois pour filtrer en mémoire
      // Cela évite de créer un index composite complexe (userId + isFixedCharge + date)
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
      const expensesRef = collection(this.firestore, 'expenses');

      const qExisting = query(
        expensesRef,
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(startOfMonth)),
        where('date', '<=', Timestamp.fromDate(endOfMonth))
      );

      const existingSnapshot = await getDocs(qExisting);
      const toDelete = existingSnapshot.docs.filter(d => d.data()['isFixedCharge'] === true);

      // 2. Récupérer tous les frais fixes et abonnements actifs configurés
      const chargesRef = collection(this.firestore, 'fixedCharges');
      const qCharges = query(chargesRef, where('userId', '==', userId));
      const chargesSnapshot = await getDocs(qCharges);
      const charges = chargesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FixedCharge));

      const subsRef = collection(this.firestore, 'subscriptions');
      const qSubs = query(subsRef, where('userId', '==', userId), where('isPaused', '==', false));
      const subsSnapshot = await getDocs(qSubs);
      const subscriptions = subsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Subscription));

      if (charges.length === 0 && subscriptions.length === 0) {
        // S'il y a des frais à supprimer mais rien à ajouter, on procède quand même à la suppression
        if (toDelete.length > 0) {
          const batch = writeBatch(this.firestore);
          toDelete.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
        return;
      }

      // 3. Utiliser un batch pour la suppression et l'ajout atomique
      const batch = writeBatch(this.firestore);

      // Suppression des anciens
      toDelete.forEach(d => batch.delete(d.ref));

      // Ajout des nouveaux frais fixes
      const date = new Date(year, month, 1);
      for (const charge of charges) {
        const newExpenseRef = doc(expensesRef);
        batch.set(newExpenseRef, {
          amount: Number(charge.amount),
          description: charge.description,
          categoryId: charge.categoryId,
          userId: userId,
          date: Timestamp.fromDate(date),
          isFixedCharge: true,
          type: 'expense'
        });
      }

      // Ajout des abonnements
      for (const sub of subscriptions) {
        const newExpenseRef = doc(expensesRef);
        batch.set(newExpenseRef, {
          amount: Number(sub.amount),
          description: sub.description,
          categoryId: sub.categoryId,
          userId: userId,
          date: Timestamp.fromDate(date),
          isFixedCharge: true,
          type: 'expense'
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Erreur lors de l\'application des frais fixes:', error);
      throw error;
    }
  }
}
