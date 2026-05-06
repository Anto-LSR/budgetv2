import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './components/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogComponent],
  template: `
    <router-outlet></router-outlet>
    <app-confirm-dialog></app-confirm-dialog>
  `,
})
export class App {
  protected readonly title = signal('budget-app');
}
