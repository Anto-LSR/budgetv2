import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, UserPlus, Plus, Trash2, Copy, Check } from 'lucide-angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedBudgetService } from '../services/shared-budget.service';
import { AuthService } from '../services/auth.service';
import { Observable, switchMap, of, combineLatest, map, take, tap } from 'rxjs';
import { SharedGroup, SharedExpense, UserProfile } from '../models/budget.models';
import { FormsModule } from '@angular/forms';

import { NavigationComponent } from '../components/navigation.component';
import { LoaderComponent } from '../components/loader.component';

@Component({
  selector: 'app-shared-expense-details',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule, NavigationComponent, LoaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24" *ngIf="data$ | async as data; else loading">
      <!-- Header -->
      <header class="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm mb-6">
        <div class="flex items-center gap-4 mb-6">
          <button routerLink="/shared-expenses" class="p-2 -ml-2 text-slate-400">
            <lucide-icon [name]="ChevronLeftIcon" class="w-6 h-6"></lucide-icon>
          </button>
          <h1 class="text-2xl font-bold text-slate-900">{{ data.group.name }}</h1>
        </div>

        <!-- Mode Switcher -->
        <app-navigation activeMode="shared"></app-navigation>

        <!-- Group Actions -->
        <div class="flex gap-2">
          <button
            (click)="copyInviteLink()"
            class="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm active:scale-95 transition-all"
          >
            <lucide-icon [name]="copied ? CheckIcon : CopyIcon" class="w-4 h-4"></lucide-icon>
            {{ copied ? 'Lien copié !' : 'Inviter' }}
          </button>
        </div>
      </header>

      <div class="px-6 space-y-8">
        <!-- Balance Section -->
        <section>
          <h2 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Équilibre</h2>
          <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-4">
            <div *ngFor="let memberId of data.group.members" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                  {{ (data.memberNames[memberId] || '?')[0].toUpperCase() }}
                </div>
                <span class="font-bold text-slate-700">{{ data.memberNames[memberId] || 'Utilisateur' }}</span>
              </div>
              <div [class]="data.balances[memberId] >= 0 ? 'text-emerald-600' : 'text-red-500'" class="font-black">
                {{ data.balances[memberId] > 0 ? '+' : '' }}{{ data.balances[memberId] | number:'1.2-2' }} €
              </div>
            </div>
          </div>
        </section>

        <!-- Expenses Section -->
        <section>
          <div class="flex justify-between items-center mb-4 px-1">
            <h2 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dépenses</h2>
            <span class="text-[10px] font-bold text-slate-400">{{ data.expenses.length }} total</span>
          </div>

          <div class="space-y-3">
            <div *ngFor="let expense of data.expenses" class="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                  <span class="font-bold text-sm">{{ (data.memberNames[expense.paidBy] || '?')[0].toUpperCase() }}</span>
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 leading-tight">{{ expense.title }}</h3>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    Payé par <span class="font-bold">{{ data.memberNames[expense.paidBy] || '?' }}</span>
                    • {{ expense.date.toDate() | date:'dd MMM' }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="font-black text-slate-900">{{ expense.amount | number:'1.2-2' }} €</span>
                <button (click)="deleteExpense(expense.id!)" class="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity">
                  <lucide-icon [name]="TrashIcon" class="w-3.5 h-3.5"></lucide-icon>
                </button>
              </div>
            </div>

            <div *ngIf="data.expenses.length === 0" class="text-center py-12 bg-white rounded-[32px] border border-slate-100 shadow-sm px-6">
              <p class="text-slate-400 text-sm italic">Aucune dépense pour le moment.</p>
            </div>
          </div>
        </section>
      </div>

      <!-- FAB for new expense -->
      <button
        [routerLink]="['/shared-expenses', data.group.id, 'add']"
        class="fixed bottom-8 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40"
      >
        <lucide-icon [name]="PlusIcon" class="w-8 h-8"></lucide-icon>
      </button>
    </div>

    <ng-template #loading>
      <app-loader [fullScreen]="true" message="Chargement du groupe..."></app-loader>
    </ng-template>
  `
})
export class SharedExpenseDetailsComponent {
  private route = inject(ActivatedRoute);
  private sharedService = inject(SharedBudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  data$: Observable<{
    group: SharedGroup,
    expenses: SharedExpense[],
    balances: { [key: string]: number },
    memberNames: { [key: string]: string }
  }>;

  copied = false;

  readonly ChevronLeftIcon = ChevronLeft;
  readonly UserPlusIcon = UserPlus;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly CopyIcon = Copy;
  readonly CheckIcon = Check;

  constructor() {
    this.data$ = this.route.params.pipe(
      switchMap(params => {
        const groupId = params['id'];
        return combineLatest({
          group: this.sharedService.getGroup(groupId),
          expenses: this.sharedService.getSharedExpenses(groupId)
        });
      }),
      switchMap(({ group, expenses }) => {
        if (!group) return of(null);

        // Récupérer les noms des membres (simulé ou via une collection users)
        // Pour cet exercice, on va faire un mock si les profils ne sont pas chargés
        const memberNames: { [key: string]: string } = {};

        // Dans un vrai cas, on ferait des getDoc pour chaque membre ou on aurait une collection users
        // Ici on simplifie en utilisant les UIDs ou des noms par défaut
        group.members.forEach(m => {
          memberNames[m] = m.substring(0, 5); // Fallback
        });

        // Tentative de récupérer les vrais noms depuis la collection 'users'
        const userQueries = group.members.map(m => this.sharedService.getUserProfile(m).pipe(take(1)));

        return combineLatest(userQueries).pipe(
          map(profiles => {
            profiles.forEach((p, index) => {
              if (p) {
                memberNames[group.members[index]] = p.displayName || p.email || group.members[index];
              }
            });

            return {
              group,
              expenses,
              balances: this.sharedService.calculateBalance(group.members, expenses),
              memberNames
            };
          })
        );
      }),
      map(data => data as any)
    );
  }

  async deleteExpense(id: string) {
    if (confirm('Supprimer cette dépense ?')) {
      await this.sharedService.deleteSharedExpense(id);
    }
  }

  copyInviteLink() {
    const groupId = this.route.snapshot.params['id'];
    const url = `${window.location.origin}/shared-expenses/join/${groupId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
