import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <--- Indispensable pour lire les champs
import { email } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Les données saisies par l'utilisateur
  loginObj = {
    email: '', // Attention: Symfony attend souvent "username" (ou email selon config)
    password: '',
  };

  onLogin() {
    console.log('Tentative de connexion...', this.loginObj);

    // On appelle la route magique du JWT
    this.http.post('http://127.0.0.1:8000/api/login_check', this.loginObj).subscribe({
      next: (res: any) => {
        console.log('🎉 SUCCÈS ! Voici ton pass VIP (Token) :', res.token);

        // 1. On stocke le token dans le navigateur (pour s'en souvenir)
        localStorage.setItem('car_token', res.token);

        // 2. On redirige vers le Dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Échec connexion', err);
        alert('Identifiants incorrects !');
      },
    });
  }
}
