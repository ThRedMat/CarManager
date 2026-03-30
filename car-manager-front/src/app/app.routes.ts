import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth.guard';
import { CarDetails } from './pages/car-details/car-details';
import { Profile } from './pages/profile/profile';
import { Historique } from './pages/historique/historique';

export const routes: Routes = [
  // 1. Les routes publiques
  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // 2. Les routes privées (protégées par le guard)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'car/:id', component: CarDetails, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'history', component: Historique, canActivate: [authGuard] },

  // 3. Les redirections (TOUJOURS À LA FIN)
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Redirige la racine vers le login
  { path: '**', redirectTo: 'login' }, // Intercepte toutes les URL qui n'existent pas
];
