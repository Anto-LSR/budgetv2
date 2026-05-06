import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, UserPlus, Plus, Trash2, Copy, Check, HandCoins, Archive, ArchiveRestore } from 'lucide-angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SharedBudgetService } from '../services/shared-budget.service';
import { AuthService } from '../services/auth.service';
import { ConfirmService } from '../services/confirm.service';
import { Observable, switchMap, of, combineLatest, map, take, tap } from 'rxjs';
import { SharedGroup, SharedExpense, UserProfile, Settlement } from '../models/budget.models';
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
        <div class="flex gap-2" *ngIf="data.group && !(data.group.archivedBy?.includes(userId))">
          <button
            (click)="copyInviteLink()"
            class="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm active:scale-95 transition-all"
          >
            <lucide-icon [name]="copied ? CheckIcon : CopyIcon" class="w-4 h-4"></lucide-icon>
            {{ copied ? 'Lien copié !' : 'Inviter' }}
          </button>
          <button
            (click)="archiveGroup(data.group.id!)"
            class="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm active:scale-95 transition-all"
          >
            <lucide-icon [name]="ArchiveIcon" class="w-4 h-4"></lucide-icon>
            Archiver
          </button>
        </div>
        <div class="flex gap-2" *ngIf="data.group && data.group.archivedBy?.includes(userId)">
          <button
            (click)="unarchiveGroup(data.group.id!)"
            class="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-2xl text-emerald-600 font-bold text-sm active:scale-95 transition-all border border-emerald-100/50"
          >
            <lucide-icon [name]="ArchiveRestoreIcon" class="w-4 h-4"></lucide-icon>
            Désarchiver
          </button>
        </div>
      </header>

      <div class="px-6 space-y-8">
        <!-- Balance Section -->
        <section>
          <h2 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Équilibre</h2>

          <div class="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 space-y-6">
            <!-- Individual Balances -->
            <div class="space-y-4 pb-6 border-b border-slate-50">
              <div *ngFor="let memberId of data.group.members" class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                    {{ (data.memberNames[memberId] || '?')[0].toUpperCase() }}
                  </div>
                  <span class="font-bold text-slate-700">{{ data.memberNames[memberId] || 'Utilisateur' }}</span>
                </div>
                <div [class]="data.balances[memberId] >= -0.01 ? 'text-emerald-600' : 'text-red-500'" class="font-black text-right">
                  <div class="text-xs uppercase opacity-50 font-bold mb-0.5">
                    {{ data.balances[memberId] >= -0.01 ? 'à recevoir' : 'à payer' }}
                  </div>
                  {{ data.balances[memberId] > 0.01 ? '+' : '' }}{{ data.balances[memberId] | number:'1.2-2' }} €
                </div>
              </div>
            </div>

            <!-- Settlements (Who owes what) -->
            <div class="space-y-4">
              <h3 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1">Remboursements à faire</h3>

              <div *ngIf="data.settlements.length === 0" class="text-center py-4 text-slate-400 text-sm italic">
                Tout est équilibré ! ✨
              </div>

              <div *ngFor="let settlement of data.settlements" class="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 flex-1">
                    <span class="font-bold text-slate-900 text-sm">{{ data.memberNames[settlement.from] }}</span>
                    <div class="flex-1 border-t border-dashed border-slate-300 mx-2 mt-1"></div>
                    <span class="font-bold text-slate-900 text-sm">{{ data.memberNames[settlement.to] }}</span>
                  </div>
                  <div class="ml-4 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                    <span class="font-black text-indigo-600 text-sm">{{ settlement.amount | number:'1.2-2' }} €</span>
                  </div>
                </div>
                <button
                  (click)="validateRepayment(data.group.id!, settlement)"
                  class="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <lucide-icon [name]="CheckIcon" class="w-3.5 h-3.5"></lucide-icon>
                  Marquer comme remboursé
                </button>
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
            <div *ngFor="let expense of data.expenses"
                 [routerLink]="expense.type === 'repayment' ? null : ['/shared-expenses', data.group.id, 'edit', expense.id]"
                 [class.cursor-default]="expense.type === 'repayment'"
                 class="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
              <div class="flex items-center gap-4">
                <div [class]="expense.type === 'repayment' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'" class="w-12 h-12 rounded-2xl flex items-center justify-center">
                  <lucide-icon *ngIf="expense.type === 'repayment'" [name]="HandCoinsIcon" class="w-6 h-6"></lucide-icon>
                  <span *ngIf="expense.type !== 'repayment'" class="font-bold text-sm">{{ (data.memberNames[expense.paidBy] || '?')[0].toUpperCase() }}</span>
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 leading-tight">
                    {{ expense.type === 'repayment' ? 'Remboursement' : expense.title }}
                  </h3>
                  <p class="text-[10px] text-slate-500 mt-0.5">
                    <ng-container *ngIf="expense.type === 'repayment'">
                      De <span class="font-bold">{{ data.memberNames[expense.paidBy] || '?' }}</span>
                      à <span class="font-bold">{{ data.memberNames[expense.splitBetween[0]] || '?' }}</span>
                    </ng-container>
                    <ng-container *ngIf="expense.type !== 'repayment'">
                      Payé par <span class="font-bold">{{ data.memberNames[expense.paidBy] || '?' }}</span>
                    </ng-container>
                    • {{ expense.date.toDate() | date:'dd MMM' }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="font-black text-slate-900">{{ expense.amount | number:'1.2-2' }} €</span>
                <div class="flex items-center gap-1 mt-1">
                  <button (click)="$event.stopPropagation(); deleteExpense(expense.id!)" class="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity">
                    <lucide-icon [name]="TrashIcon" class="w-3.5 h-3.5"></lucide-icon>
                  </button>
                </div>
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
  private confirmService = inject(ConfirmService);
  private router = inject(Router);

  data$: Observable<{
    group: SharedGroup,
    expenses: SharedExpense[],
    balances: { [key: string]: number },
    settlements: Settlement[],
    memberNames: { [key: string]: string }
  }>;

  copied = false;

  readonly ChevronLeftIcon = ChevronLeft;
  readonly UserPlusIcon = UserPlus;
  readonly PlusIcon = Plus;
  readonly TrashIcon = Trash2;
  readonly CopyIcon = Copy;
  readonly CheckIcon = Check;
  readonly ArchiveIcon = Archive;
  readonly ArchiveRestoreIcon = ArchiveRestore;
  readonly HandCoinsIcon = HandCoins;

  userId: string = '';

  constructor() {
    this.authService.user$.subscribe(user => {
      if (user) this.userId = user.uid;
    });
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

            const balances = this.sharedService.calculateBalance(group.members, expenses);
            this.memberNamesFallback = memberNames;
            return {
              group,
              expenses,
              balances,
              settlements: this.sharedService.calculateSettlements(balances),
              memberNames
            };
          })
        );
      }),
      map(data => data as any)
    );
  }

  async deleteExpense(id: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Supprimer l\'élément',
      message: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
      confirmText: 'Supprimer',
      type: 'danger'
    });

    if (confirmed) {
      await this.sharedService.deleteSharedExpense(id);
    }
  }

  async validateRepayment(groupId: string, settlement: Settlement) {
    const confirmed = await this.confirmService.confirm({
      title: 'Confirmer le remboursement',
      message: `Confirmer le remboursement de ${settlement.amount.toFixed(2)}€ de ${this.memberNamesFallback[settlement.from]} à ${this.memberNamesFallback[settlement.to]} ?`,
      confirmText: 'Confirmer'
    });

    if (confirmed) {
      await this.sharedService.addRepayment(groupId, settlement.from, settlement.to, settlement.amount);
    }
  }

  // Stockage temporaire des noms pour la boîte de dialogue de confirmation
  private memberNamesFallback: { [key: string]: string } = {};

  async archiveGroup(groupId: string) {
    const confirmed = await this.confirmService.confirm({
      title: 'Archiver le groupe',
      message: 'Le groupe sera déplacé dans vos archives. Vous pourrez le réactiver plus tard. Les autres membres continueront à le voir.',
      confirmText: 'Archiver'
    });

    if (confirmed) {
      if (this.userId) {
        await this.sharedService.archiveGroup(groupId, this.userId);
        this.router.navigate(['/shared-expenses']);
      }
    }
  }

  unarchiveGroup(groupId: string) {
    if (this.userId) {
      this.sharedService.unarchiveGroup(groupId, this.userId);
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
