import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { BudgetService } from '../services/budget.service';
import { ConfirmService } from '../services/confirm.service';
import { LucideAngularModule, Plus, TrendingDown, Wallet, LogOut, Tag, Trash2, ChevronLeft, ChevronRight, Zap, Coins, Edit2, Search, ArrowUpDown, Filter, ChevronUp, ChevronDown, Repeat, BarChart3, TrendingUp } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map, switchMap, of, BehaviorSubject, combineLatest, take } from 'rxjs';

import { NavigationComponent } from '../components/navigation.component';
import { LoaderComponent } from '../components/loader.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule, NavigationComponent, LoaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24" *ngIf="(user$ | async) as user; else fullPageLoader">
      <!-- Header -->
      <header class="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <div>
            <p class="text-slate-500 text-sm">Bonjour,</p>
            <h1 class="text-2xl font-bold text-slate-900">{{ user.displayName }}</h1>
          </div>
          <button (click)="logout()" class="p-2 text-slate-400 hover:text-red-500">
            <lucide-icon [name]="LogOutIcon" class="w-6 h-6"></lucide-icon>
          </button>
        </div>

        <!-- Month Selector -->
        <div class="flex items-center justify-between mb-6 bg-slate-50 p-2 rounded-2xl relative">
          <button (click)="previousMonth()" class="p-2 text-slate-600 hover:bg-white rounded-xl transition-colors">
            <lucide-icon [name]="ChevronLeftIcon" class="w-5 h-5"></lucide-icon>
          </button>
          <div class="text-center">
            <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest">{{ currentMonthDate | date:'yyyy' }}</p>
            <p class="text-lg font-bold text-slate-900 capitalize">{{ currentMonthDate | date:'MMMM' }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button (click)="goToStats()" class="p-2 text-indigo-600 hover:bg-white rounded-xl transition-colors" title="Statistiques">
              <lucide-icon [name]="BarChart3Icon" class="w-5 h-5"></lucide-icon>
            </button>
            <button (click)="nextMonth()" class="p-2 text-slate-600 hover:bg-white rounded-xl transition-colors">
              <lucide-icon [name]="ChevronRightIcon" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Mode Switcher -->
        <app-navigation activeMode="budget"></app-navigation>

        <!-- Financial Summary Cards -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <!-- Total Incomes Card -->
          <div (click)="goToSalary()" class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-all group relative overflow-hidden">
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
                    <lucide-icon [name]="CoinsIcon" class="w-4 h-4"></lucide-icon>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Entrées</span>
                </div>
                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                  <lucide-icon [name]="PlusIcon" class="w-3 h-3 text-slate-400"></lucide-icon>
                </div>
              </div>
              <h2 class="text-xl font-black text-slate-900 leading-none group-hover:text-emerald-600 transition-colors">
                {{ ((salary$ | async) || 0) + ((totalIncomes$ | async) || 0) | number:'1.2-2' }} €
              </h2>
              <p *ngIf="(totalIncomes$ | async) as extraIncomes" class="text-[9px] text-emerald-600 font-bold mt-1">
                dont {{ extraIncomes | number:'1.2-2' }} € supp.
              </p>
            </div>
          </div>

          <!-- Balance Card -->
          <div class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all">
            <div class="relative z-10">
              <div class="flex items-center gap-2 mb-2">
                <div class="p-2 rounded-xl shadow-lg transition-all" [class.bg-indigo-600]="((remaining$ | async) || 0) >= 0" [class.shadow-indigo-100]="((remaining$ | async) || 0) >= 0" [class.bg-red-500]="((remaining$ | async) || 0) < 0" [class.shadow-red-100]="((remaining$ | async) || 0) < 0">
                  <lucide-icon [name]="WalletIcon" class="w-4 h-4 text-white"></lucide-icon>
                </div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Reste</span>
              </div>
              <h2 class="text-xl font-black leading-none transition-colors" [class.text-slate-900]="((remaining$ | async) || 0) >= 0" [class.text-red-600]="((remaining$ | async) || 0) < 0">
                {{ (remaining$ | async) || 0 | number:'1.2-2' }} €
              </h2>
            </div>
          </div>
        </div>

        <!-- Total Expenses Card -->
        <div class="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden">
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-4 opacity-80">
              <div class="p-2 bg-white/20 rounded-xl">
                <lucide-icon [name]="TrendingDownIcon" class="w-5 h-5"></lucide-icon>
              </div>
              <span class="text-xs font-bold uppercase tracking-[0.2em]">Dépenses totales</span>
            </div>
            <h2 class="text-5xl font-black mb-6 tracking-tight leading-none">{{ totalExpenses$ | async | number:'1.2-2' }} €</h2>
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="flex items-center gap-2 text-slate-300 bg-white/10 w-fit px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-md">
                <lucide-icon [name]="ZapIcon" class="w-3 h-3"></lucide-icon>
                <span class="capitalize">{{ currentMonthDate | date:'MMMM' }}</span>
              </div>
              <div *ngIf="(fixedExpensesTotal$ | async) as fixedTotal" class="flex items-center gap-2 text-indigo-200 bg-indigo-500/20 w-fit px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-md border border-indigo-400/20">
                <span>dont {{ fixedTotal | number:'1.2-2' }} € en frais fixes & abos</span>
              </div>
            </div>
          </div>
          <!-- Decorative element -->
          <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>
      </header>

      <main class="p-6">
        <!-- Quick Actions -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <button (click)="goToSalary()" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
             <div class="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <lucide-icon [name]="CoinsIcon" class="w-5 h-5"></lucide-icon>
             </div>
             <span class="text-xs font-semibold text-slate-600">Salaire</span>
          </button>

          <button routerLink="/categories" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
             <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                <lucide-icon [name]="TagIcon" class="w-5 h-5"></lucide-icon>
             </div>
             <span class="text-xs font-semibold text-slate-600">Catégories</span>
          </button>

          <button routerLink="/fixed-charges" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
             <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <lucide-icon [name]="ZapIcon" class="w-5 h-5"></lucide-icon>
             </div>
             <span class="text-xs font-semibold text-slate-600">Frais Fixes</span>
          </button>

          <button routerLink="/subscriptions" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
             <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <lucide-icon [name]="RepeatIcon" class="w-5 h-5"></lucide-icon>
             </div>
             <span class="text-xs font-semibold text-slate-600">Abonnements</span>
          </button>
        </div>

        <div class="flex flex-col gap-3 mb-8">


          <button
            (click)="applyFixedCharges()"
            class="w-full py-4 bg-white border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <lucide-icon [name]="ZapIcon" class="w-5 h-5"></lucide-icon>
            Appliquer les frais fixes du mois
          </button>
        </div>

        <!-- Recent Expenses -->
        <div class="flex flex-col gap-4 mb-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold text-slate-900">Dépenses récentes</h3>
            <button class="text-indigo-600 text-sm font-medium">Tout voir</button>
          </div>

          <!-- Search and Sort Bar -->
          <div class="flex gap-3">
            <div class="search-container flex-1">
              <lucide-icon [name]="SearchIcon" class="search-icon"></lucide-icon>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="Rechercher..."
                class="search-input"
              >
            </div>
            <button
              (click)="toggleSortOrder()"
              class="sort-button-small"
              [title]="sortOrder === 'desc' ? 'Ordre croissant' : 'Ordre décroissant'"
            >
              <lucide-icon [name]="sortOrder === 'desc' ? ChevronDownIcon : ChevronUpIcon" class="w-4 h-4"></lucide-icon>
            </button>
            <button
              (click)="toggleSortBy()"
              class="sort-button flex-1"
              [title]="sortBy === 'date' ? 'Trier par prix' : 'Trier par date'"
            >
              <div class="flex items-center gap-2">
                <lucide-icon [name]="ArrowUpDownIcon" class="w-4 h-4"></lucide-icon>
                <span class="text-xs font-bold uppercase tracking-wider">Par {{ sortBy === 'date' ? 'Date' : 'Prix' }}</span>
              </div>
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div *ngIf="(expenses$ | async) === null" class="py-12">
            <app-loader message="Chargement des dépenses..."></app-loader>
          </div>

          <div *ngFor="let expense of filteredExpenses$ | async" class="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-50 group">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
              [style.backgroundColor]="getCategoryColor(expense.categoryId) || '#94a3b8'"
            >
              <!-- Icon placeholder - in real app would use icon from category -->
              <span class="font-bold text-lg leading-none">{{ getCategoryName(expense.categoryId)?.substring(0,1) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-slate-900 truncate">{{ expense.description }}</h4>
              <p class="text-xs text-slate-500 truncate">{{ getCategoryName(expense.categoryId) }} • {{ expense.date?.toDate() | date:'shortDate' }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-bold whitespace-nowrap" [class.text-slate-900]="(expense.type || 'expense') === 'expense'" [class.text-emerald-600]="expense.type === 'income'">
                {{ expense.type === 'income' ? '+' : '-' }}{{ expense.amount | number:'1.2-2' }} €
              </p>
              <button (click)="deleteExpense(expense.id!)" class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <lucide-icon [name]="TrashIcon" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>

          <div *ngIf="(expenses$ | async)?.length === 0" class="text-center py-12">
             <p class="text-slate-400 text-sm">Aucune dépense pour le moment.</p>
          </div>
        </div>
      </main>

      <!-- Floating Action Button with Menu -->
      <div class="fixed bottom-8 right-6 flex flex-col items-end gap-3 z-50">
        <!-- Overlay backdrop to close menu -->
        <div
          *ngIf="showFabMenu"
          (click)="showFabMenu = false"
          class="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[-1]"
        ></div>

        <!-- Income FAB -->
        <button
          *ngIf="showFabMenu"
          type="button"
          routerLink="/add-expense"
          [queryParams]="{ type: 'income' }"
          (click)="showFabMenu = false"
          class="w-14 h-14 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all animate-in slide-in-from-bottom-4"
        >
          <lucide-icon [name]="TrendingUpIcon" class="w-6 h-6"></lucide-icon>
          <span class="absolute right-16 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap">Revenu</span>
        </button>

        <!-- Expense FAB -->
        <button
          *ngIf="showFabMenu"
          type="button"
          routerLink="/add-expense"
          [queryParams]="{ type: 'expense' }"
          (click)="showFabMenu = false"
          class="w-14 h-14 bg-red-600 text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all animate-in slide-in-from-bottom-2"
        >
          <lucide-icon [name]="TrendingDownIcon" class="w-6 h-6"></lucide-icon>
          <span class="absolute right-16 bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap">Dépense</span>
        </button>

        <!-- Main FAB -->
        <button
          type="button"
          (click)="showFabMenu = !showFabMenu"
          class="w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
          [class.rotate-45]="showFabMenu"
        >
          <lucide-icon [name]="PlusIcon" class="w-8 h-8"></lucide-icon>
        </button>
      </div>
    </div>

    <ng-template #fullPageLoader>
      <app-loader [fullScreen]="true" message="Initialisation..."></app-loader>
    </ng-template>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private budgetService = inject(BudgetService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly PlusIcon = Plus;
  readonly WalletIcon = Wallet;
  readonly TrendingDownIcon = TrendingDown;
  readonly TrendingUpIcon = TrendingUp;
  readonly LogOutIcon = LogOut;
  readonly TagIcon = Tag;
  readonly TrashIcon = Trash2;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly ZapIcon = Zap;
  readonly CoinsIcon = Coins;
  readonly Edit2Icon = Edit2;
  readonly SearchIcon = Search;
  readonly ArrowUpDownIcon = ArrowUpDown;
  readonly FilterIcon = Filter;
  readonly ChevronUpIcon = ChevronUp;
  readonly ChevronDownIcon = ChevronDown;
  readonly RepeatIcon = Repeat;

  readonly BarChart3Icon = BarChart3;

  showFabMenu = false;

  user$ = isPlatformBrowser(this.platformId) ? this.authService.user$ : of(null);
  categories: any[] = [];

  private searchTermSubject = new BehaviorSubject<string>('');
  private sortOrderSubject = new BehaviorSubject<'asc' | 'desc'>('desc');
  private sortBySubject = new BehaviorSubject<'date' | 'amount'>('date');

  get searchTerm(): string { return this.searchTermSubject.value; }
  set searchTerm(value: string) { this.searchTermSubject.next(value); }

  get sortOrder(): 'asc' | 'desc' { return this.sortOrderSubject.value; }
  set sortOrder(value: 'asc' | 'desc') { this.sortOrderSubject.next(value); }

  get sortBy(): 'date' | 'amount' { return this.sortBySubject.value; }
  set sortBy(value: 'date' | 'amount') { this.sortBySubject.next(value); }

  private currentDateSubject = new BehaviorSubject<Date>(new Date());
  currentDate$ = this.currentDateSubject.asObservable();

  expenses$ = combineLatest([this.user$, this.currentDate$]).pipe(
    switchMap(([user, date]) => {
      if (!user) return of([]);
      return this.budgetService.getExpensesByMonth(user.uid, date.getMonth(), date.getFullYear());
    })
  );

  filteredExpenses$ = combineLatest([
    this.expenses$,
    this.searchTermSubject,
    this.sortOrderSubject,
    this.sortBySubject
  ]).pipe(
    map(([expenses, searchTerm, sortOrder, sortBy]) => {
      let filtered = expenses.filter(e => !e.isFixedCharge);

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(e =>
          e.description.toLowerCase().includes(term) ||
          this.getCategoryName(e.categoryId).toLowerCase().includes(term)
        );
      }

      return filtered.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
          const dateA = a.date?.toDate().getTime() || 0;
          const dateB = b.date?.toDate().getTime() || 0;
          comparison = dateA - dateB;
        } else {
          comparison = (a.amount || 0) - (b.amount || 0);
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    })
  );

  salary$ = combineLatest([this.user$, this.currentDate$]).pipe(
    switchMap(([user, date]) => {
      if (!user) return of(0);
      return this.budgetService.getSalaryByMonth(user.uid, date.getMonth(), date.getFullYear()).pipe(
        map(salaries => salaries.length > 0 ? salaries[0].amount : 0)
      );
    })
  );

  totalExpenses$ = this.expenses$.pipe(
    map(expenses => expenses
      .filter(e => (e.type || 'expense') === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0)
    )
  );

  totalIncomes$ = this.expenses$.pipe(
    map(expenses => expenses
      .filter(e => e.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0)
    )
  );

  fixedExpensesTotal$ = this.expenses$.pipe(
    map(expenses => expenses
      .filter(e => e.isFixedCharge)
      .reduce((acc, curr) => acc + curr.amount, 0)
    )
  );

  remaining$ = combineLatest([this.salary$, this.totalIncomes$, this.totalExpenses$]).pipe(
    map(([salary, incomes, expenses]) => salary + incomes - expenses)
  );

  get currentMonthDate() {
    return this.currentDateSubject.value;
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.user$.pipe(
        switchMap(user => {
          if (user) {
            this.budgetService.ensureDefaultCategories(user.uid);
            return this.budgetService.getCategories(user.uid);
          }
          return of([]);
        })
      ).subscribe(cats => this.categories = cats);
    }
  }

  previousMonth() {
    const d = this.currentDateSubject.value;
    this.currentDateSubject.next(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.currentDateSubject.value;
    this.currentDateSubject.next(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  getCategoryName(id: string) {
    if (!this.categories || !id) return '';
    return this.categories.find(c => c.id === id)?.name;
  }

  getCategoryColor(id: string) {
    if (!this.categories || !id) return '#94a3b8';
    return this.categories.find(c => c.id === id)?.color;
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSortBy() {
    this.sortBy = this.sortBy === 'date' ? 'amount' : 'date';
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
  }

  async deleteExpense(id: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Supprimer la dépense',
      message: 'Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      type: 'danger'
    });

    if (confirmed) {
      await this.budgetService.deleteExpense(id);
    }
  }

  async applyFixedCharges() {
    const user = await this.user$.pipe(take(1)).toPromise();
    if (user) {
      const confirmed = await this.confirmService.confirm({
        title: 'Appliquer les frais fixes',
        message: 'Appliquer tous les frais fixes pour ce mois ? Cela supprimera les frais fixes déjà appliqués pour éviter les doublons.',
        confirmText: 'Appliquer'
      });

      if (confirmed) {
        try {
          const d = this.currentDateSubject.value;
          await this.budgetService.applyFixedCharges(user.uid, d.getMonth(), d.getFullYear());
          // On pourrait aussi remplacer alert par un toast plus tard, mais restons sur confirm pour l'instant
          alert('Frais fixes appliqués avec succès !');
        } catch (error) {
          console.error(error);
          alert('Une erreur est survenue lors de l\'application des frais fixes. Veuillez réessayer.');
        }
      }
    }
  }

  goToSalary() {
    const d = this.currentDateSubject.value;
    this.router.navigate(['/salary'], {
      queryParams: {
        month: d.getMonth(),
        year: d.getFullYear()
      }
    });
  }

  goToStats() {
    const d = this.currentDateSubject.value;
    this.router.navigate(['/stats'], {
      queryParams: {
        month: d.getMonth(),
        year: d.getFullYear()
      }
    });
  }
}
