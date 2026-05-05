import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, Plus, Trash2 } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';
import { take, switchMap, of, Observable } from 'rxjs';
import { Category, UserProfile } from '../models/budget.models';

import { NavigationComponent } from '../components/navigation.component';
import { LoaderComponent } from '../components/loader.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule, NavigationComponent, LoaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="p-6 bg-white flex items-center justify-between shadow-sm">
        <button (click)="back()" class="p-2 -ml-2 text-slate-900">
          <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
        </button>
        <h1 class="text-xl font-bold">Catégories</h1>
        <div class="w-10"></div>
      </header>

      <main class="p-6">
        <!-- Mode Switcher -->
        <app-navigation activeMode="budget"></app-navigation>
        <!-- Add Category Form -->
        <div class="bg-white p-6 rounded-3xl shadow-sm mb-8 border border-slate-100">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Nouvelle Catégorie</h2>
          <div class="space-y-4">
            <input
              [(ngModel)]="newCategory.name"
              placeholder="Nom de la catégorie"
              class="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
            <div class="flex flex-wrap gap-3">
              <button
                *ngFor="let color of colors"
                (click)="newCategory.color = color"
                [style.backgroundColor]="color"
                class="w-8 h-8 rounded-full transition-transform active:scale-75"
                [class.ring-4]="newCategory.color === color"
                [class.ring-slate-200]="newCategory.color === color"
              ></button>
            </div>
            <button
              (click)="addCategory()"
              [disabled]="!newCategory.name || !newCategory.color"
              class="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <lucide-icon [name]="PlusIcon" class="w-5 h-5"></lucide-icon>
              Ajouter
            </button>
          </div>
        </div>

        <!-- Categories List -->
        <div class="space-y-4">
          <div *ngIf="(categories$ | async) === null" class="py-8">
            <app-loader message="Chargement des catégories..."></app-loader>
          </div>
          <div *ngFor="let cat of categories$ | async" class="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-50">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" [style.backgroundColor]="cat.color">
              {{ cat.name.substring(0,1) }}
            </div>
            <span class="flex-1 font-bold text-slate-900">{{ cat.name }}</span>
            <!-- Suppression non implémentée dans le service pour la sécurité, mais simple à ajouter -->
          </div>
        </div>
      </main>
    </div>
  `
})
export class CategoriesComponent {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly PlusIcon = Plus;

  colors = ['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

  newCategory = {
    name: '',
    color: '#4f46e5',
    icon: 'tag'
  };

  categories$: Observable<Category[]> = isPlatformBrowser(this.platformId) ? this.authService.user$.pipe(
    take(1),
    switchMap((user: UserProfile | null) => user ? this.budgetService.getCategories(user.uid) : of([]))
  ) : of([]);

  back() {
    this.router.navigate(['/dashboard']);
  }

  async addCategory() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user) {
      await this.budgetService.addCategory({ ...this.newCategory, userId: user.uid });
      this.newCategory.name = '';
    }
  }
}
