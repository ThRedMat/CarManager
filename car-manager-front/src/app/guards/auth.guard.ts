import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('car_token');

  // Si le token existe, on laisse passer
  if (token) {
    return true;
  }

  // Sinon, on renvoie vers le login et on bloque l'accès
  router.navigate(['/login']);
  return false;
};
