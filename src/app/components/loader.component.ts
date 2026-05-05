import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="fullScreen ? 'fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center' : 'flex flex-col items-center justify-center p-8 w-full'">
      <div class="relative">
        <!-- Main spinner -->
        <div class="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <!-- Pulse effect -->
        <div class="absolute inset-0 w-12 h-12 border-4 border-indigo-600/20 rounded-full animate-ping"></div>
      </div>
      <p *ngIf="message" class="mt-4 text-slate-500 font-bold text-sm animate-pulse tracking-wide uppercase">{{ message }}</p>
    </div>
  `,
  styles: [`
    @keyframes ping {
      75%, 100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
    .animate-ping {
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class LoaderComponent {
  @Input() fullScreen = false;
  @Input() message = 'Chargement...';
}
