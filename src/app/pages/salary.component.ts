import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, Check } from 'lucide-angular';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="p-6 bg-white flex items-center justify-between shadow-sm">
        <button (click)="back()" class="p-2 -ml-2 text-slate-900">
          <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
        </button>
        <h1 class="text-xl font-bold">Mon Salaire</h1>
        <div class="w-10"></div>
      </header>

      <main class="p-6">
        <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
          <p class="text-slate-500 text-sm mb-6 text-center">
            Saisissez votre salaire net pour le mois de
            <span class="font-bold text-slate-900 capitalize">{{ monthDate | date:'MMMM yyyy' }}</span>.
          </p>

          <div class="relative mb-8">
            <input
              type="number"
              [(ngModel)]="salaryAmount"
              class="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-6 py-6 text-4xl font-black text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-none transition-all text-center"
              placeholder="0.00"
              step="0.01"
            >
            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">€</span>
          </div>

          <button
            (click)="save()"
            class="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
          >
            <lucide-icon [name]="CheckIcon" class="w-5 h-5"></lucide-icon>
            Valider le salaire du mois
          </button>
        </div>
      </main>
    </div>
  `
})
export class SalaryComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly CheckIcon = Check;

  salaryAmount = 0;
  monthDate = new Date();

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const month = params['month'];
      const year = params['year'];
      if (month !== undefined && year !== undefined) {
        this.monthDate = new Date(year, month, 1);
      }
      this.loadSalary();
    });
  }

  async loadSalary() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user) {
      this.budgetService.getSalaryByMonth(
        user.uid,
        this.monthDate.getMonth(),
        this.monthDate.getFullYear()
      ).pipe(take(1)).subscribe(salaries => {
        if (salaries && salaries.length > 0) {
          this.salaryAmount = salaries[0].amount;
        }
      });
    }
  }

  back() {
    this.router.navigate(['/dashboard']);
  }

  async save() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user) {
      await this.budgetService.setSalary({
        amount: this.salaryAmount,
        month: this.monthDate.getMonth(),
        year: this.monthDate.getFullYear(),
        userId: user.uid
      });
      this.back();
    }
  }
}
