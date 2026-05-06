import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, Save, Check, HandCoins } from 'lucide-angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedBudgetService } from '../services/shared-budget.service';
import { AuthService } from '../services/auth.service';
import { BudgetService } from '../services/budget.service';
import { Observable, switchMap, of, combineLatest, map, take } from 'rxjs';
import { SharedGroup, SharedExpense, UserProfile, Category } from '../models/budget.models';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from '../components/loader.component';

@Component({
  selector: 'app-add-shared-expense',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule, LoaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24" *ngIf="data$ | async as data; else loading">
      <!-- Header -->
      <header class="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm mb-6">
        <div class="flex items-center gap-4">
          <button [routerLink]="['/shared-expenses', data.group.id]" class="p-2 -ml-2 text-slate-400">
            <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
          </button>
          <h1 class="text-2xl font-bold text-slate-900">{{ isEditMode ? 'Modifier la dépense' : 'Ajouter une dépense' }}</h1>
        </div>
      </header>

      <div class="px-6 space-y-6">
        <!-- Type Selector -->
        <div *ngIf="!isEditMode" class="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <button
            (click)="expense.type = 'expense'"
            [class]="expense.type !== 'repayment' ? 'bg-slate-900 text-white' : 'text-slate-500'"
            class="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
          >
            Dépense
          </button>
          <button
            (click)="expense.type = 'repayment'; expense.title = 'Remboursement'"
            [class]="expense.type === 'repayment' ? 'bg-emerald-600 text-white' : 'text-slate-500'"
            class="flex-1 py-3 rounded-xl text-xs font-bold transition-all"
          >
            Remboursement
          </button>
        </div>

        <!-- Title & Amount -->
        <div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
          <div *ngIf="expense.type !== 'repayment'">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Titre</label>
            <input
              [(ngModel)]="expense.title"
              type="text"
              placeholder="Courses, Restaurant..."
              class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            >
          </div>

          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Montant (€)</label>
            <input
              [(ngModel)]="expense.amount"
              type="number"
              placeholder="0.00"
              class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 text-3xl font-black focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            >
          </div>
        </div>

        <!-- Repayment logic: From -> To -->
        <div *ngIf="expense.type === 'repayment'" class="space-y-6">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">De (celui qui a payé)</label>
            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let memberId of data.group.members"
                (click)="expense.paidBy = memberId"
                [class]="expense.paidBy === memberId ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-100'"
                class="px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                {{ data.memberNames[memberId] }}
              </button>
            </div>
          </div>

          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">À (celui qui reçoit)</label>
            <div class="flex flex-wrap gap-2">
              <button
                *ngFor="let memberId of data.group.members"
                (click)="expense.splitBetween = [memberId]"
                [class]="expense.splitBetween[0] === memberId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-100'"
                class="px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                {{ data.memberNames[memberId] }}
              </button>
            </div>
          </div>
        </div>

        <!-- Paid By (Expense mode) -->
        <div *ngIf="expense.type !== 'repayment'">
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block px-1">Payé par</label>
          <div class="flex flex-wrap gap-2">
            <button
              *ngFor="let memberId of data.group.members"
              (click)="expense.paidBy = memberId"
              [class]="expense.paidBy === memberId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border border-slate-100'"
              class="px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              {{ data.memberNames[memberId] }}
            </button>
          </div>
        </div>

        <!-- Shared With (Expense mode) -->
        <div *ngIf="expense.type !== 'repayment'">
          <div class="flex justify-between items-center mb-3 px-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Partagé avec</label>
            <button (click)="toggleAll(data.group.members)" class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              {{ expense.splitBetween.length === data.group.members.length ? 'Tout décocher' : 'Tout cocher' }}
            </button>
          </div>
          <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div
              *ngFor="let memberId of data.group.members"
              (click)="toggleMember(memberId)"
              class="flex items-center justify-between p-4 border-b border-slate-50 last:border-none active:bg-slate-50 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                  {{ (data.memberNames[memberId] || '?')[0].toUpperCase() }}
                </div>
                <span class="font-bold text-slate-700">{{ data.memberNames[memberId] }}</span>
              </div>
              <div
                [class]="expense.splitBetween.includes(memberId) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'"
                class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
              >
                <lucide-icon *ngIf="expense.splitBetween.includes(memberId)" [name]="CheckIcon" class="w-4 h-4 text-white"></lucide-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Expense Option -->
        <div *ngIf="!isEditMode && data.currentUser && expense.paidBy === data.currentUser.uid" class="space-y-4">
          <div
            (click)="expense.addToPersonalExpenses = !expense.addToPersonalExpenses"
            class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <lucide-icon [name]="CheckIcon" class="w-6 h-6"></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-slate-900">Ajouter à mes frais</h3>
                <p class="text-xs text-slate-400">Inclure dans mon budget du mois</p>
              </div>
            </div>
            <div
              [class]="expense.addToPersonalExpenses ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'"
              class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
            >
              <lucide-icon *ngIf="expense.addToPersonalExpenses" [name]="CheckIcon" class="w-4 h-4 text-white"></lucide-icon>
            </div>
          </div>

          <!-- Category Selection (only if addToPersonalExpenses is true) -->
          <div *ngIf="expense.addToPersonalExpenses" class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block px-1">Choisir une catégorie</label>
            <div class="grid grid-cols-4 gap-4">
              <button
                *ngFor="let cat of data.categories"
                (click)="expense.personalCategoryId = cat.id"
                [class]="expense.personalCategoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'"
                class="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
              >
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                  [style.backgroundColor]="expense.personalCategoryId === cat.id ? 'rgba(255,255,255,0.2)' : cat.color"
                >
                  <span *ngIf="!expense.personalCategoryId || expense.personalCategoryId !== cat.id" class="text-white">{{ cat.name.substring(0, 1) }}</span>
                  <lucide-icon *ngIf="expense.personalCategoryId === cat.id" [name]="CheckIcon" class="w-5 h-5 text-white"></lucide-icon>
                </div>
                <span class="text-[10px] font-bold truncate w-full text-center">{{ cat.name }}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          (click)="saveExpense(data.group.id!)"
          [disabled]="!isFormValid()"
          class="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-4"
        >
          {{ isEditMode ? 'Modifier la dépense' : 'Enregistrer la dépense' }}
        </button>
      </div>
    </div>

    <ng-template #loading>
      <app-loader [fullScreen]="true" message="Préparation du formulaire..."></app-loader>
    </ng-template>
  `
})
export class AddSharedExpenseComponent {
  private route = inject(ActivatedRoute);
  private sharedService = inject(SharedBudgetService);
  private authService = inject(AuthService);
  private budgetService = inject(BudgetService);
  private router = inject(Router);

  data$: Observable<{
    group: SharedGroup,
    memberNames: { [key: string]: string },
    currentUser: UserProfile | null,
    categories: Category[]
  }>;

  isEditMode = false;
  expenseId: string | null = null;

  expense: any = {
    title: '',
    amount: null,
    paidBy: '',
    splitBetween: [],
    date: new Date(),
    addToPersonalExpenses: false,
    personalCategoryId: '',
    type: 'expense'
  };

  readonly ChevronLeftIcon = ChevronLeft;
  readonly CheckIcon = Check;
  readonly HandCoinsIcon = HandCoins;

  constructor() {
    this.data$ = this.route.params.pipe(
      switchMap(params => {
        const groupId = params['id'];
        this.expenseId = params['expenseId'] || null;
        this.isEditMode = !!this.expenseId;

        return combineLatest({
          group: this.sharedService.getGroup(groupId),
          existingExpense: this.isEditMode ? this.sharedService.getSharedExpense(this.expenseId!).pipe(take(1)) : of(null)
        });
      }),
      switchMap(({ group, existingExpense }) => {
        if (!group) return of(null);

        if (existingExpense) {
          this.expense = {
            ...existingExpense,
            date: (existingExpense.date as any).toDate ? (existingExpense.date as any).toDate() : existingExpense.date
          };
        }

        const memberNames: { [key: string]: string } = {};
        const userQueries = group.members.map(m => this.sharedService.getUserProfile(m).pipe(take(1)));

        return combineLatest([
          combineLatest(userQueries),
          this.authService.user$.pipe(take(1))
        ]).pipe(
          switchMap(([profiles, currentUser]) => {
            profiles.forEach((p, index) => {
              if (p) {
                memberNames[group.members[index]] = p.displayName || p.email || group.members[index];
              } else {
                memberNames[group.members[index]] = group.members[index].substring(0, 5);
              }
            });

            // Init defaults
            if (!this.isEditMode && currentUser && !this.expense.paidBy) {
              this.expense.paidBy = currentUser.uid;
              this.expense.splitBetween = [...group.members];
            }

            const categories$ = currentUser ? this.budgetService.getCategories(currentUser.uid).pipe(take(1)) : of([]);

            return categories$.pipe(
              map(categories => ({
                group,
                memberNames,
                currentUser,
                categories
              }))
            );
          })
        );
      }),
      map(data => data as any)
    );
  }

  toggleMember(memberId: string) {
    const index = this.expense.splitBetween.indexOf(memberId);
    if (index > -1) {
      this.expense.splitBetween.splice(index, 1);
    } else {
      this.expense.splitBetween.push(memberId);
    }
  }

  toggleAll(allMembers: string[]) {
    if (this.expense.splitBetween.length === allMembers.length) {
      this.expense.splitBetween = [];
    } else {
      this.expense.splitBetween = [...allMembers];
    }
  }

  isFormValid() {
    if (this.expense.type === 'repayment') {
      return this.expense.amount > 0 && this.expense.paidBy && this.expense.splitBetween.length === 1 && this.expense.paidBy !== this.expense.splitBetween[0];
    }
    const baseValid = this.expense.title && this.expense.amount > 0 && this.expense.paidBy && this.expense.splitBetween.length > 0;
    if (this.expense.addToPersonalExpenses) {
      return baseValid && this.expense.personalCategoryId;
    }
    return baseValid;
  }

  async saveExpense(groupId: string) {
    if (!this.isFormValid()) return;

    if (this.isEditMode && this.expenseId) {
      await this.sharedService.updateSharedExpense(this.expenseId, {
        title: this.expense.title,
        amount: this.expense.amount,
        paidBy: this.expense.paidBy,
        splitBetween: this.expense.splitBetween,
        date: this.expense.date,
        type: this.expense.type || 'expense'
      });
    } else {
      await this.sharedService.addSharedExpense({
        ...this.expense,
        type: this.expense.type || 'expense',
        groupId
      });
    }

    this.router.navigate(['/shared-expenses', groupId]);
  }
}
