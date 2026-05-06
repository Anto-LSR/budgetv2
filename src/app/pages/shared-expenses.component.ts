import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, Plus, ArrowRight, Wallet, Archive, ArchiveRestore } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';
import { SharedBudgetService } from '../services/shared-budget.service';
import { AuthService } from '../services/auth.service';
import { Observable, switchMap, of, BehaviorSubject, combineLatest } from 'rxjs';
import { SharedGroup } from '../models/budget.models';
import { FormsModule } from '@angular/forms';

import { NavigationComponent } from '../components/navigation.component';
import { LoaderComponent } from '../components/loader.component';

@Component({
  selector: 'app-shared-expenses',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule, FormsModule, NavigationComponent, LoaderComponent],
  template: `
    <div class="min-h-screen bg-slate-50 pb-24">
      <!-- Header -->
      <header class="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm mb-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Dépenses partagées</h1>
            <p class="text-slate-500 text-sm">Gérez vos comptes à plusieurs</p>
          </div>
          <div class="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <lucide-icon [name]="UsersIcon" class="w-6 h-6"></lucide-icon>
          </div>
        </div>

        <!-- Mode Switcher -->
        <app-navigation activeMode="shared"></app-navigation>
      </header>

  <div class="px-6">
        <!-- Tabs for Active/Archived -->
        <div class="flex gap-4 mb-6 px-1">
          <button
            (click)="showArchived = false"
            [class.text-indigo-600]="!showArchived"
            [class.border-indigo-600]="!showArchived"
            [class.text-slate-400]="showArchived"
            [class.border-transparent]="showArchived"
            class="pb-2 border-b-2 font-bold text-sm transition-all"
          >
            Actifs
          </button>
          <button
            (click)="showArchived = true"
            [class.text-indigo-600]="showArchived"
            [class.border-indigo-600]="showArchived"
            [class.text-slate-400]="!showArchived"
            [class.border-transparent]="!showArchived"
            class="pb-2 border-b-2 font-bold text-sm transition-all flex items-center gap-2"
          >
            Archivés
          </button>
        </div>

        <div *ngIf="(groups$ | async) as groups; else loading">
          <!-- Empty State -->
          <div *ngIf="groups.length === 0" class="text-center py-12 bg-white rounded-[32px] border border-slate-100 shadow-sm px-6">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon [name]="showArchived ? ArchiveIcon : UsersIcon" class="w-10 h-10 text-slate-300"></lucide-icon>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">{{ showArchived ? 'Aucun groupe archivé' : 'Aucun groupe' }}</h3>
            <p class="text-slate-500 text-sm mb-8">{{ showArchived ? 'Vos groupes archivés apparaîtront ici.' : 'Créez votre premier groupe pour commencer à partager vos dépenses.' }}</p>
          </div>

          <!-- Groups List -->
          <div class="grid gap-4">
            <div
              *ngFor="let group of groups"
              class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all group relative"
            >
              <div class="flex items-center gap-4 flex-1" (click)="goToGroup(group.id!)">
                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <lucide-icon [name]="UsersIcon" class="w-6 h-6"></lucide-icon>
                </div>
                <div>
                  <h3 class="font-bold text-slate-900">{{ group.name }}</h3>
                  <p class="text-xs text-slate-500">{{ group.members.length }} membre(s)</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  *ngIf="showArchived"
                  (click)="$event.stopPropagation(); unarchiveGroup(group.id!)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 active:scale-90 transition-all border border-emerald-100/50"
                  title="Réactiver"
                >
                  <lucide-icon [name]="ArchiveRestoreIcon" class="w-5 h-5"></lucide-icon>
                </button>
                <button
                  *ngIf="!showArchived"
                  (click)="$event.stopPropagation(); archiveGroup(group.id!)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 bg-slate-50 active:scale-90 transition-all border border-slate-200/50"
                  title="Archiver"
                >
                  <lucide-icon [name]="ArchiveIcon" class="w-5 h-5"></lucide-icon>
                </button>
                <div
                  *ngIf="!showArchived"
                  (click)="goToGroup(group.id!)"
                  class="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 bg-indigo-50 active:scale-90 transition-all border border-indigo-100/50"
                >
                  <lucide-icon [name]="ArrowRightIcon" class="w-5 h-5"></lucide-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ng-template #loading>
          <app-loader message="Chargement des groupes..."></app-loader>
        </ng-template>
      </div>

      <!-- FAB for new group -->
      <button
        (click)="showCreateModal = true"
        class="fixed bottom-8 right-6 w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-40"
      >
        <lucide-icon [name]="PlusIcon" class="w-8 h-8"></lucide-icon>
      </button>

      <!-- Create Group Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-4">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-2xl font-black text-slate-900">Nouveau groupe</h2>
            <button (click)="showCreateModal = false" class="p-2 text-slate-400">
              <lucide-icon [name]="PlusIcon" class="w-6 h-6 rotate-45"></lucide-icon>
            </button>
          </div>

          <div class="space-y-6">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Nom du groupe</label>
              <input
                [(ngModel)]="newGroupName"
                type="text"
                placeholder="Vacances, Coloc..."
                class="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
              >
            </div>

            <button
              (click)="createGroup()"
              [disabled]="!newGroupName"
              class="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all disabled:opacity-50"
            >
              Créer le groupe
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SharedExpensesComponent {
  private sharedService = inject(SharedBudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  showArchived$ = new BehaviorSubject<boolean>(false);
  groups$: Observable<SharedGroup[]>;
  showCreateModal = false;
  newGroupName = '';

  get showArchived() { return this.showArchived$.value; }
  set showArchived(value: boolean) { this.showArchived$.next(value); }

  readonly UsersIcon = Users;
  readonly PlusIcon = Plus;
  readonly ArrowRightIcon = ArrowRight;
  readonly ArchiveIcon = Archive;
  readonly ArchiveRestoreIcon = ArchiveRestore;

  constructor() {
    this.groups$ = combineLatest([
      this.authService.user$,
      this.showArchived$
    ]).pipe(
      switchMap(([user, showArchived]) => {
        if (user) {
          return this.sharedService.getGroups(user.uid, showArchived);
        }
        return of([]);
      })
    );
  }

  async unarchiveGroup(groupId: string) {
    const user = await new Promise<any>(resolve => this.authService.user$.subscribe(resolve));
    if (user) {
      await this.sharedService.unarchiveGroup(groupId, user.uid);
    }
  }

  async archiveGroup(groupId: string) {
    const user = await new Promise<any>(resolve => this.authService.user$.subscribe(resolve));
    if (user) {
      await this.sharedService.archiveGroup(groupId, user.uid);
    }
  }

  async createGroup() {
    const user = await new Promise<any>(resolve => this.authService.user$.subscribe(resolve));
    if (user && this.newGroupName) {
      const doc = await this.sharedService.createGroup(this.newGroupName, user.uid);
      this.showCreateModal = false;
      this.newGroupName = '';
      this.router.navigate(['/shared-expenses', doc.id]);
    }
  }

  goToGroup(groupId: string) {
    this.router.navigate(['/shared-expenses', groupId]);
  }
}
