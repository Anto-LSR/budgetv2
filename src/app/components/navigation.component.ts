import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex bg-slate-100 p-1.5 rounded-2xl mb-6 shadow-sm border border-slate-200/50">
      <button
        routerLink="/dashboard"
        [class.bg-white]="activeMode === 'budget'"
        [class.text-indigo-600]="activeMode === 'budget'"
        [class.shadow-sm]="activeMode === 'budget'"
        [class.text-slate-500]="activeMode !== 'budget'"
        class="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
      >
        Mode Budget
      </button>
      <button
        routerLink="/shared-expenses"
        [class.bg-white]="activeMode === 'shared'"
        [class.text-indigo-600]="activeMode === 'shared'"
        [class.shadow-sm]="activeMode === 'shared'"
        [class.text-slate-500]="activeMode !== 'shared'"
        class="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
      >
        Dépenses partagées
      </button>
    </div>
  `
})
export class NavigationComponent {
  @Input() activeMode: 'budget' | 'shared' = 'budget';
}
