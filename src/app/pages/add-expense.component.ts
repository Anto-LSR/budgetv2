import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ChevronLeft, Save, X, TrendingDown, TrendingUp } from 'lucide-angular';
import { take, switchMap, of, Observable, combineLatest, map, startWith, BehaviorSubject } from 'rxjs';
import { Category, UserProfile } from '../models/budget.models';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-white">
      <header class="p-6 flex items-center justify-between">
        <button (click)="back()" class="p-2 -ml-2 text-slate-900">
          <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
        </button>
        <h1 class="text-xl font-bold">{{ isIncome ? 'Nouveau revenu' : 'Nouvelle dépense' }}</h1>
        <div class="w-10"></div>
      </header>

      <main class="p-6">
        <form (ngSubmit)="save()" #expenseForm="ngForm" class="space-y-8">
          <!-- Type Toggle -->
          <div class="flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              (click)="setType('expense')"
              class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              [class.bg-white]="!isIncome"
              [class.shadow-sm]="!isIncome"
              [class.text-red-600]="!isIncome"
              [class.text-slate-500]="isIncome"
            >
              <lucide-icon [name]="TrendingDownIcon" class="w-4 h-4"></lucide-icon>
              <span class="font-bold text-sm">Dépense</span>
            </button>
            <button
              type="button"
              (click)="setType('income')"
              class="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              [class.bg-white]="isIncome"
              [class.shadow-sm]="isIncome"
              [class.text-emerald-600]="isIncome"
              [class.text-slate-500]="!isIncome"
            >
              <lucide-icon [name]="TrendingUpIcon" class="w-4 h-4"></lucide-icon>
              <span class="font-bold text-sm">Revenu</span>
            </button>
          </div>

          <!-- Amount input - Big and center -->
          <div class="text-center py-8">
            <span class="text-slate-400 text-sm block mb-2 uppercase tracking-widest font-semibold">Montant</span>
            <div class="flex items-center justify-center gap-2">
               <input
                type="number"
                name="amount"
                [(ngModel)]="expense.amount"
                required
                placeholder="0.00"
                class="text-6xl font-bold text-center w-full bg-transparent focus:outline-none placeholder:text-slate-100 transition-colors"
                [class.text-red-600]="!isIncome && expense.amount > 0"
                [class.text-emerald-600]="isIncome && expense.amount > 0"
                step="0.01"
              >
              <span class="text-4xl font-bold text-slate-300">€</span>
            </div>
          </div>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-semibold text-slate-500 mb-2">Description</label>
              <input
                type="text"
                name="description"
                [(ngModel)]="expense.description"
                required
                placeholder="Courses, Restaurant, Loyer..."
                class="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
            </div>

            <div>
              <div class="space-y-3 mb-4">
                <label class="block text-sm font-semibold text-slate-500">Catégorie</label>
                <div class="relative w-full">
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    name="searchQuery"
                    (ngModelChange)="onSearchChange($event)"
                    placeholder="Rechercher une catégorie..."
                    class="w-full px-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                  <button
                    *ngIf="searchQuery"
                    type="button"
                    (click)="searchQuery = ''; onSearchChange('')"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 active:bg-slate-200 rounded-full transition-colors"
                  >
                    <lucide-icon [name]="XIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-3 max-h-[320px] overflow-y-auto p-1 -m-1 custom-scrollbar">
                <button
                  type="button"
                  *ngFor="let cat of filteredCategories$ | async"
                  (click)="expense.categoryId = cat.id!"
                  [class.ring-2]="expense.categoryId === cat.id"
                  [class.ring-indigo-600]="expense.categoryId === cat.id"
                  class="p-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95"
                  [style.backgroundColor]="expense.categoryId === cat.id ? cat.color + '20' : '#f8fafc'"
                >
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white" [style.backgroundColor]="cat.color">
                    <span class="text-xs font-bold">{{ cat.name.substring(0,1) }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-600 truncate w-full text-center">{{ cat.name }}</span>
                </button>

                <div
                  *ngIf="(filteredCategories$ | async)?.length === 0"
                  class="col-span-3 py-8 text-center"
                >
                  <p class="text-slate-400 text-sm italic">Aucune catégorie trouvée</p>
                </div>

                <button
                  type="button"
                  routerLink="/categories"
                  class="p-3 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400"
                >
                  <span class="text-xl">+</span>
                  <span class="text-[10px] font-bold">New</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-500 mb-2">Date</label>
              <input
                type="date"
                name="date"
                [(ngModel)]="expense.date"
                required
                class="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
              >
            </div>
          </div>

          <button
            type="submit"
            [disabled]="!expenseForm.form.valid || !expense.categoryId"
            class="w-full py-5 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            [class.bg-indigo-600]="!isIncome"
            [class.shadow-indigo-100]="!isIncome"
            [class.bg-emerald-600]="isIncome"
            [class.shadow-emerald-100]="isIncome"
            [class.disabled:opacity-50]="true"
            [class.disabled:shadow-none]="true"
          >
            <lucide-icon [name]="SaveIcon" class="w-5 h-5"></lucide-icon>
            Enregistrer
          </button>
        </form>
      </main>
    </div>
  `
})
export class AddExpenseComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly SaveIcon = Save;
  readonly XIcon = X;
  readonly TrendingDownIcon = TrendingDown;
  readonly TrendingUpIcon = TrendingUp;

  expense = {
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    userId: '',
    type: 'expense' as 'expense' | 'income'
  };

  get isIncome() {
    return this.expense.type === 'income';
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.expense.type = params['type'];
      }
    });
  }

  setType(type: 'expense' | 'income') {
    this.expense.type = type;
  }

  searchQuery = '';
  private searchSubject = new BehaviorSubject<string>('');

  categories$: Observable<Category[]> = isPlatformBrowser(this.platformId) ? this.authService.user$.pipe(
    take(1),
    switchMap((user: UserProfile | null) => user ? this.budgetService.getCategories(user.uid) : of([]))
  ) : of([]);

  filteredCategories$: Observable<Category[]> = combineLatest([
    this.categories$,
    this.searchSubject.asObservable()
  ]).pipe(
    map(([categories, query]) => {
      if (!query) return categories;
      const lowerQuery = query.toLowerCase();
      return categories.filter(cat =>
        cat.name.toLowerCase().includes(lowerQuery)
      );
    })
  );

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  back() {
    this.router.navigate(['/dashboard']);
  }

  async save() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user) {
      this.expense.userId = user.uid;
      await this.budgetService.addExpense(this.expense as any);
      this.router.navigate(['/dashboard']);
    }
  }
}
