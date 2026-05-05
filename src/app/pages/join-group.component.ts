import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedBudgetService } from '../services/shared-budget.service';
import { AuthService } from '../services/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-join-group',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div class="bg-white rounded-[40px] p-8 shadow-xl max-w-md w-full">
        <div class="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <div class="animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
        </div>
        <h1 class="text-2xl font-black text-slate-900 mb-2">Rejoindre le groupe</h1>
        <p class="text-slate-500 mb-8">Veuillez patienter pendant que nous vous ajoutons au groupe...</p>
        <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  `
})
export class JoinGroupComponent {
  private route = inject(ActivatedRoute);
  private sharedService = inject(SharedBudgetService);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.join();
  }

  async join() {
    const groupId = this.route.snapshot.params['id'];
    this.authService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        await this.sharedService.joinGroup(groupId, user.uid);
        this.router.navigate(['/shared-expenses', groupId]);
      } else {
        // Rediriger vers le login s'il n'est pas connecté, puis il reviendra ici
        this.router.navigate(['/login'], { queryParams: { returnUrl: window.location.pathname } });
      }
    });
  }
}
