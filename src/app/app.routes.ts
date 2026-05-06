import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { CategoriesComponent } from './pages/categories.component';
import { AddExpenseComponent } from './pages/add-expense.component';
import { FixedChargesComponent } from './pages/fixed-charges.component';
import { SubscriptionsComponent } from './pages/subscriptions.component';
import { SalaryComponent } from './pages/salary.component';
import { StatsComponent } from './pages/stats.component';
import { SharedExpensesComponent } from './pages/shared-expenses.component';
import { SharedExpenseDetailsComponent } from './pages/shared-expense-details.component';
import { AddSharedExpenseComponent } from './pages/add-shared-expense.component';
import { JoinGroupComponent } from './pages/join-group.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'categories', component: CategoriesComponent, canActivate: [authGuard] },
  { path: 'fixed-charges', component: FixedChargesComponent, canActivate: [authGuard] },
  { path: 'subscriptions', component: SubscriptionsComponent, canActivate: [authGuard] },
  { path: 'salary', component: SalaryComponent, canActivate: [authGuard] },
  { path: 'stats', component: StatsComponent, canActivate: [authGuard] },
  { path: 'add-expense', component: AddExpenseComponent, canActivate: [authGuard] },
  { path: 'shared-expenses', component: SharedExpensesComponent, canActivate: [authGuard] },
  { path: 'shared-expenses/:id', component: SharedExpenseDetailsComponent, canActivate: [authGuard] },
  { path: 'shared-expenses/:id/add', component: AddSharedExpenseComponent, canActivate: [authGuard] },
  { path: 'shared-expenses/:id/edit/:expenseId', component: AddSharedExpenseComponent, canActivate: [authGuard] },
  { path: 'shared-expenses/join/:id', component: JoinGroupComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];
