import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LucideAngularModule, LogIn } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div class="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center">
        <div class="mb-8">
          <div class="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <span class="text-white text-4xl font-bold">B</span>
          </div>
          <h1 class="text-3xl font-extrabold text-slate-900 mb-2">BudgetV2</h1>
          <p class="text-slate-500">Gérez vos finances en toute simplicité.</p>
        </div>

        <button
          *ngIf="isBrowser"
          (click)="login()"
          class="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <lucide-icon [name]="LogInIcon" class="w-5 h-5"></lucide-icon>
          Se connecter avec Google
        </button>

        <p class="mt-8 text-xs text-slate-400">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  isBrowser = isPlatformBrowser(this.platformId);
  readonly LogInIcon = LogIn;

  async login() {
    if (!this.isBrowser) return;
    try {
      await this.authService.loginWithGoogle();
      // On attend un peu que l'état d'authentification se mette à jour si nécessaire
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login error', error);
      alert(error.message || 'Une erreur est survenue lors de la connexion.');
    }
  }
}
