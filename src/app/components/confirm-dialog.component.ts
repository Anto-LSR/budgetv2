import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        (click)="cancel()">
      </div>

      <!-- Modal -->
      <div
        class="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4"
        (click)="$event.stopPropagation()">

        <div class="p-6">
          <div class="flex flex-col items-center text-center">
            <!-- Icon -->
            <div
              [class]="options?.type === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'"
              class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <svg *ngIf="options?.type === 'danger'" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <svg *ngIf="options?.type !== 'danger'" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 class="text-xl font-bold text-slate-900 mb-2">{{ options?.title }}</h3>
            <p class="text-slate-500 text-sm leading-relaxed mb-8">
              {{ options?.message }}
            </p>

            <div class="flex flex-col w-full gap-3">
              <button
                (click)="confirm()"
                [class]="options?.type === 'danger' ? 'bg-red-600 shadow-red-100' : 'bg-indigo-600 shadow-indigo-100'"
                class="w-full py-4 rounded-2xl text-white font-bold transition-all active:scale-95 shadow-lg">
                {{ options?.confirmText || 'Confirmer' }}
              </button>
              <button
                (click)="cancel()"
                class="w-full py-4 rounded-2xl text-slate-500 font-semibold hover:bg-slate-50 transition-all active:scale-95">
                {{ options?.cancelText || 'Annuler' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent implements OnInit {
  isOpen = false;
  options: ConfirmOptions | null = null;
  private resolveCallback: ((result: boolean) => void) | null = null;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit() {
    this.confirmService.confirm$.subscribe(({ options, resolve }) => {
      this.options = options;
      this.resolveCallback = resolve;
      this.isOpen = true;
    });
  }

  confirm() {
    this.isOpen = false;
    if (this.resolveCallback) this.resolveCallback(true);
  }

  cancel() {
    this.isOpen = false;
    if (this.resolveCallback) this.resolveCallback(false);
  }
}
