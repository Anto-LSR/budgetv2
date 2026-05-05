import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { AuthService } from '../services/auth.service';
import { LucideAngularModule, ChevronLeft, ChevronRight, BarChart3, PieChart, Calendar } from 'lucide-angular';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { combineLatest, map, Observable, of, switchMap, take, BehaviorSubject } from 'rxjs';
import { Category, Expense, UserProfile } from '../models/budget.models';

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

import { NavigationComponent } from '../components/navigation.component';
import { LoaderComponent } from '../components/loader.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, NavigationComponent, LoaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-12">
      <header class="p-6 bg-white flex items-center justify-between shadow-sm sticky top-0 z-20">
        <button (click)="back()" class="p-2 -ml-2 text-slate-900">
          <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
        </button>
        <h1 class="text-xl font-bold">Statistiques</h1>
        <div class="w-10"></div>
      </header>

      <main class="p-6">
        <!-- Mode Switcher -->
        <app-navigation activeMode="budget"></app-navigation>
        <!-- Range Selector -->
        <div class="bg-white p-2 rounded-2xl flex gap-2 mb-8 shadow-sm border border-slate-100">
          <button
            (click)="setRange('month')"
            [class.bg-slate-900]="viewRange === 'month'"
            [class.text-white]="viewRange === 'month'"
            [class.text-slate-600]="viewRange !== 'month'"
            class="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all"
          >
            Mois
          </button>
          <button
            (click)="setRange('year')"
            [class.bg-slate-900]="viewRange === 'year'"
            [class.text-white]="viewRange === 'year'"
            [class.text-slate-600]="viewRange !== 'year'"
            class="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all"
          >
            Année
          </button>
        </div>

        <!-- Date Selector -->
        <div class="flex items-center justify-between mb-8 bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
          <button (click)="previous()" class="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <lucide-icon [name]="ChevronLeftIcon" class="w-5 h-5"></lucide-icon>
          </button>
          <div class="text-center">
            <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest">{{ currentDate | date: (viewRange === 'month' ? 'yyyy' : '') }}</p>
            <p class="text-lg font-bold text-slate-900 capitalize">{{ currentDate | date: (viewRange === 'month' ? 'MMMM' : 'yyyy') }}</p>
          </div>
          <button (click)="next()" class="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <lucide-icon [name]="ChevronRightIcon" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <div *ngIf="(stats$ | async) as stats; else loading">
          <ng-container *ngIf="stats.length > 0; else noData">

            <!-- Total Card -->
            <div class="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl shadow-slate-200 mb-8 relative overflow-hidden">
                <div class="relative z-10">
                    <p class="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Total des dépenses</p>
                    <h2 class="text-4xl font-black mb-1">{{ totalSpent$ | async | number:'1.2-2' }} €</h2>
                    <p class="text-slate-400 text-xs font-medium">{{ viewRange === 'month' ? (currentDate | date:'MMMM yyyy') : (currentDate | date:'yyyy') }}</p>
                </div>
                <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
            </div>

            <!-- Visual Graph (Bar Chart) -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <lucide-icon [name]="BarChart3Icon" class="w-4 h-4"></lucide-icon>
                    Répartition
                </h3>
                <div class="space-y-6">
                    <div *ngFor="let stat of stats">
                        <div class="flex justify-between items-end mb-2">
                            <span class="text-sm font-bold text-slate-700">{{ stat.categoryName }}</span>
                            <span class="text-xs font-black text-slate-400">{{ stat.total | number:'1.2-2' }} € ({{ stat.percentage }}%)</span>
                        </div>
                        <div class="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-1000 ease-out"
                                [style.width.%]="stat.percentage"
                                [style.backgroundColor]="stat.categoryColor"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Breakdown List -->
            <div class="space-y-4">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                    <lucide-icon [name]="PieChartIcon" class="w-4 h-4"></lucide-icon>
                    Détails par catégorie
                </h3>
                <div *ngFor="let stat of stats" class="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-50 transition-transform active:scale-[0.98]">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" [style.backgroundColor]="stat.categoryColor">
                        {{ stat.categoryName.substring(0,1) }}
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-slate-900">{{ stat.categoryName }}</p>
                        <p class="text-xs text-slate-500">{{ stat.percentage }}% de la période</p>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-slate-900">{{ stat.total | number:'1.2-2' }} €</p>
                    </div>
                </div>
            </div>

          </ng-container>
        </div>

        <ng-template #noData>
          <div class="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
             <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide-icon [name]="CalendarIcon" class="w-10 h-10 text-slate-300"></lucide-icon>
             </div>
             <h3 class="text-lg font-bold text-slate-900 mb-2">Aucune donnée</h3>
             <p class="text-slate-400 text-sm max-w-[200px] mx-auto">Vous n'avez pas encore enregistré de dépenses pour cette période.</p>
          </div>
        </ng-template>

        <ng-template #loading>
          <app-loader message="Analyse de vos finances..."></app-loader>
        </ng-template>
      </main>
    </div>
  `
})
export class StatsComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly BarChart3Icon = BarChart3;
  readonly PieChartIcon = PieChart;
  readonly CalendarIcon = Calendar;

  currentDate = new Date();
  viewRange: 'month' | 'year' = 'month';
  private dateSubject = new BehaviorSubject<Date>(new Date());

  stats$: Observable<CategoryStat[]> = of([]);
  totalSpent$: Observable<number> = of(0);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Récupérer les paramètres si présents (optionnel pour l'instant)
    const month = this.route.snapshot.queryParamMap.get('month');
    const year = this.route.snapshot.queryParamMap.get('year');
    if (month && year) {
        this.currentDate = new Date(parseInt(year), parseInt(month), 1);
        this.dateSubject.next(this.currentDate);
    }
  }

  // Refactor stats$ to react to range changes correctly
  private rangeSubject = new BehaviorSubject<'month' | 'year'>('month');

  constructor() {
    this.stats$ = combineLatest([
        this.authService.user$,
        this.dateSubject,
        this.rangeSubject
    ]).pipe(
        switchMap(([user, date, range]) => {
            if (!user) return of([]);

            const expenses$ = range === 'month'
                ? this.budgetService.getExpensesByMonth(user.uid, date.getMonth(), date.getFullYear())
                : this.budgetService.getExpensesByYear(user.uid, date.getFullYear());

            const categories$ = this.budgetService.getCategories(user.uid);

            return combineLatest([expenses$, categories$]).pipe(
                map(([expenses, categories]) => {
                    const onlyExpenses = expenses.filter(e => (e.type || 'expense') === 'expense');
                    const total = onlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                    if (total === 0) return [];

                    const grouped = onlyExpenses.reduce((acc, curr) => {
                        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount;
                        return acc;
                    }, {} as Record<string, number>);

                    return Object.entries(grouped)
                        .map(([catId, amount]) => {
                            const cat = categories.find(c => c.id === catId);
                            return {
                                categoryId: catId,
                                categoryName: cat?.name || 'Inconnu',
                                categoryColor: cat?.color || '#94a3b8',
                                total: amount,
                                percentage: parseFloat(((amount / total) * 100).toFixed(1))
                            };
                        })
                        .sort((a, b) => b.total - a.total);
                })
            );
        })
    );

    this.totalSpent$ = this.stats$.pipe(
        map(stats => stats.reduce((acc, curr) => acc + curr.total, 0))
    );
  }

  setRange(range: 'month' | 'year') {
    this.viewRange = range;
    this.rangeSubject.next(range);
  }

  previous() {
    if (this.viewRange === 'month') {
      this.currentDate = new Date(this.currentDate.setMonth(this.currentDate.getMonth() - 1));
    } else {
      this.currentDate = new Date(this.currentDate.setFullYear(this.currentDate.getFullYear() - 1));
    }
    this.dateSubject.next(new Date(this.currentDate));
  }

  next() {
    if (this.viewRange === 'month') {
      this.currentDate = new Date(this.currentDate.setMonth(this.currentDate.getMonth() + 1));
    } else {
      this.currentDate = new Date(this.currentDate.setFullYear(this.currentDate.getFullYear() + 1));
    }
    this.dateSubject.next(new Date(this.currentDate));
  }

  back() {
    this.router.navigate(['/dashboard']);
  }
}
