import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <--- Important pour les formulaires

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule], // <--- On ajoute FormsModule ici
  templateUrl: './register.html', // Vérifie que c'est bien le bon nom de fichier
  styleUrl: './register.scss',
})
export class Register {
  private http = inject(HttpClient);
  private router = inject(Router);

  // L'objet qui va stocker les données du formulaire
  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };

  onRegister() {
    console.log("Tentative d'inscription...", this.registerData);

    // On envoie les données à ta route Symfony
    this.http.post('http://127.0.0.1:8000/api/register', this.registerData).subscribe({
      next: (response) => {
        console.log('Succès !', response);
        alert('Compte créé avec succès ! Tu peux te connecter.');
        // On redirige vers la page de login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erreur inscription', err);
        alert("Erreur : Vérifie que le serveur tourne ou que l'email n'est pas déjà pris.");
      },
    });
  }
}
