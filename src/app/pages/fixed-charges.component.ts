import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BudgetService } from '../services/budget.service';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, Plus, Trash2, Save, Edit2, X } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';
import { take, switchMap, of, Observable, combineLatest, map, startWith, BehaviorSubject } from 'rxjs';
import { Category, FixedCharge, UserProfile } from '../models/budget.models';

@Component({
  selector: 'app-fixed-charges',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="p-6 bg-white flex items-center justify-between shadow-sm">
        <button (click)="back()" class="p-2 -ml-2 text-slate-900">
          <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
        </button>
        <h1 class="text-xl font-bold">Frais Fixes</h1>
        <div class="w-10"></div>
      </header>

      <main class="p-6">
        <!-- Add Fixed Charge Form -->
        <div class="bg-white p-6 rounded-3xl shadow-sm mb-8 border border-slate-100">
          <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Nouveau Frais Fixe</h2>
          <div class="space-y-4">
            <input
              [(ngModel)]="newCharge.description"
              placeholder="Description (ex: Loyer, Netflix...)"
              class="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
            <div class="flex items-center gap-2">
              <input
                type="number"
                [(ngModel)]="newCharge.amount"
                placeholder="Montant"
                class="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
              <span class="font-bold text-slate-400">€</span>
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

              <div class="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1 -m-1 custom-scrollbar">
                <button
                  type="button"
                  *ngFor="let cat of filteredCategories$ | async"
                  (click)="newCharge.categoryId = cat.id!"
                  [class.ring-2]="newCharge.categoryId === cat.id"
                  [class.ring-indigo-600]="newCharge.categoryId === cat.id"
                  class="p-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95"
                  [style.backgroundColor]="newCharge.categoryId === cat.id ? cat.color + '20' : '#f8fafc'"
                >
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white" [style.backgroundColor]="cat.color">
                    <span class="text-xs font-bold">{{ cat.name.substring(0,1) }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-600 truncate w-full text-center">{{ cat.name }}</span>
                </button>

                <div
                  *ngIf="(filteredCategories$ | async)?.length === 0"
                  class="col-span-3 py-4 text-center"
                >
                  <p class="text-slate-400 text-sm italic">Aucune catégorie trouvée</p>
                </div>
              </div>
            </div>

            <button
              (click)="addCharge()"
              [disabled]="!newCharge.description || !newCharge.amount || !newCharge.categoryId"
              class="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <lucide-icon [name]="PlusIcon" class="w-5 h-5"></lucide-icon>
              Ajouter
            </button>
          </div>
        </div>

        <!-- Fixed Charges List -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-slate-900">Mes frais récurrents</h2>
          <div class="text-right">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
            <p class="text-lg font-black text-indigo-600 leading-none">{{ totalFixedCharges$ | async | number:'1.2-2' }} €</p>
          </div>
        </div>
        <div class="space-y-4">
          <div *ngFor="let charge of charges$ | async" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 group">
            <div *ngIf="editingId !== charge.id" class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" [style.backgroundColor]="getCategoryColor(charge.categoryId)">
                {{ getCategoryName(charge.categoryId).substring(0,1) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-bold text-slate-900 truncate">{{ charge.description }}</p>
                <p class="text-xs text-slate-500 truncate">{{ getCategoryName(charge.categoryId) }}</p>
              </div>
              <div class="text-right flex items-center gap-3 shrink-0">
                <span class="font-bold text-slate-900 whitespace-nowrap">{{ charge.amount | number:'1.2-2' }} €</span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button (click)="startEdit(charge)" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <lucide-icon [name]="Edit2Icon" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button (click)="deleteCharge(charge.id!)" class="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                    <lucide-icon [name]="TrashIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Edit Mode -->
            <div *ngIf="editingId === charge.id" class="space-y-4">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase">Modifier</span>
                <button (click)="cancelEdit()" class="text-slate-400">
                  <lucide-icon [name]="XIcon" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
              <input
                [(ngModel)]="editCharge.description"
                class="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              >
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  [(ngModel)]="editCharge.amount"
                  class="flex-1 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                >
                <span class="font-bold text-slate-400">€</span>
              </div>
              <div class="space-y-3 mb-4">
                <label class="block text-sm font-semibold text-slate-500">Modifier la catégorie</label>
                <div class="relative w-full">
                  <input
                    type="text"
                    [(ngModel)]="searchQueryEdit"
                    name="searchQueryEdit"
                    (ngModelChange)="onSearchChangeEdit($event)"
                    placeholder="Rechercher..."
                    class="w-full px-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  >
                  <button
                    *ngIf="searchQueryEdit"
                    type="button"
                    (click)="searchQueryEdit = ''; onSearchChangeEdit('')"
                    class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <lucide-icon [name]="XIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                <button
                  type="button"
                  *ngFor="let cat of filteredCategoriesEdit$ | async"
                  (click)="editCharge.categoryId = cat.id!"
                  [class.ring-2]="editCharge.categoryId === cat.id"
                  [class.ring-indigo-600]="editCharge.categoryId === cat.id"
                  class="p-2 rounded-xl flex flex-col items-center gap-1 transition-all"
                  [style.backgroundColor]="editCharge.categoryId === cat.id ? cat.color + '20' : '#f8fafc'"
                >
                  <div class="w-6 h-6 rounded-lg flex items-center justify-center text-white" [style.backgroundColor]="cat.color">
                    <span class="text-[10px] font-bold">{{ cat.name.substring(0,1) }}</span>
                  </div>
                  <span class="text-[8px] font-bold text-slate-600 truncate w-full text-center">{{ cat.name }}</span>
                </button>
              </div>
              <button
                (click)="saveEdit()"
                [disabled]="!editCharge.description || !editCharge.amount || !editCharge.categoryId"
                class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <lucide-icon [name]="SaveIcon" class="w-4 h-4"></lucide-icon>
                Enregistrer
              </button>
            </div>
          </div>

          <div *ngIf="(charges$ | async)?.length === 0" class="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
             <p class="text-slate-400 text-sm">Aucun frais fixe défini.</p>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class FixedChargesComponent {
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  readonly ChevronLeftIcon = ChevronLeft;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly Edit2Icon = Edit2;
  readonly SaveIcon = Save;
  readonly XIcon = X;

  editingId: string | null = null;
  editCharge: Partial<FixedCharge> = {};

  newCharge = {
    description: '',
    amount: 0,
    categoryId: ''
  };

  searchQuery = '';
  private searchSubject = new BehaviorSubject<string>('');

  searchQueryEdit = '';
  private searchSubjectEdit = new BehaviorSubject<string>('');

  categories: Category[] = [];

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

  filteredCategoriesEdit$: Observable<Category[]> = combineLatest([
    this.categories$,
    this.searchSubjectEdit.asObservable()
  ]).pipe(
    map(([categories, query]) => {
      if (!query) return categories;
      const lowerQuery = query.toLowerCase();
      return categories.filter(cat =>
        cat.name.toLowerCase().includes(lowerQuery)
      );
    })
  );

  charges$: Observable<FixedCharge[]> = isPlatformBrowser(this.platformId) ? this.authService.user$.pipe(
    switchMap((user: UserProfile | null) => user ? this.budgetService.getFixedCharges(user.uid) : of([]))
  ) : of([]);

  totalFixedCharges$: Observable<number> = this.charges$.pipe(
    map(charges => charges.reduce((acc, curr) => acc + curr.amount, 0))
  );

  constructor() {
    this.categories$.subscribe(cats => this.categories = cats);
  }

  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  onSearchChangeEdit(query: string) {
    this.searchSubjectEdit.next(query);
  }

  back() {
    this.router.navigate(['/dashboard']);
  }

  getCategoryName(id: string) {
    return this.categories.find(c => c.id === id)?.name || '';
  }

  getCategoryColor(id: string) {
    return this.categories.find(c => c.id === id)?.color || '#94a3b8';
  }

  async addCharge() {
    if (!isPlatformBrowser(this.platformId)) return;
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (user) {
      await this.budgetService.addFixedCharge({ ...this.newCharge, userId: user.uid });
      this.newCharge = { description: '', amount: 0, categoryId: '' };
    }
  }

  async deleteCharge(id: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Supprimer le frais fixe',
      message: 'Êtes-vous sûr de vouloir supprimer ce frais fixe ?',
      confirmText: 'Supprimer',
      type: 'danger'
    });

    if (confirmed) {
      await this.budgetService.deleteFixedCharge(id);
    }
  }

  startEdit(charge: FixedCharge) {
    this.editingId = charge.id!;
    this.editCharge = { ...charge };
  }

  cancelEdit() {
    this.editingId = null;
    this.editCharge = {};
  }

  async saveEdit() {
    if (!this.editingId) return;
    await this.budgetService.updateFixedCharge(this.editingId, this.editCharge);
    this.cancelEdit();
  }
}
