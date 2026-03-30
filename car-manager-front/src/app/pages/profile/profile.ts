import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class Profile implements OnInit {
  userId: number | null = null;

  // NOUVEAU : Nos indicateurs d'état
  isLoading: boolean = true;
  isSaving: boolean = false;

  userData = {
    email: '',
    first_name: '',
    last_name: '',
    plainPassword: '',
  };

  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.extractUserId();
    if (this.userId) {
      this.loadUserProfile();
    } else {
      this.router.navigate(['/login']);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  extractUserId() {
    const token = localStorage.getItem('car_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.id) {
          this.userId = payload.id;
        }
      } catch (e) {
        console.error('Erreur lecture token');
      }
    }
  }

  loadUserProfile() {
    //console.log("1. Début de la requête pour l'ID :", this.userId);
    this.isLoading = true;

    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json', // On force Symfony à répondre en JSON simple
    });

    this.http.get<any>(`http://127.0.0.1:8000/api/users/${this.userId}`, { headers }).subscribe({
      next: (data) => {
        //console.log('2. Données reçues du serveur :', data);
        this.userData.email = data.email;
        this.userData.first_name = data.first_name || '';
        this.userData.last_name = data.last_name || '';
      },
      error: (err) => {
        //console.error('2. Erreur interceptée par Angular :', err);
        this.errorMessage = 'Impossible de charger vos informations.';
        this.isLoading = false;
        this.cdr.detectChanges(); // On s'assure que Angular rafraîchit l'affichage après la mise à jour de l'état de chargement et du message d'erreur
      },
      complete: () => {
        //console.log('3. Requête totalement terminée.');
        this.isLoading = false; // On force l'arrêt du spinner à la fin, quoi qu'il arrive
        this.cdr.detectChanges(); // On s'assure que Angular rafraîchit l'affichage après la mise à jour des données et de l'état de chargement
      },
    });
  }

  saveProfile() {
    this.successMessage = '';
    this.errorMessage = '';
    this.isSaving = true; // On desactive le bouton pendant la sauvegarde

    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/merge-patch+json',
    });

    const payload: any = {
      email: this.userData.email,
      first_name: this.userData.first_name,
      last_name: this.userData.last_name,
    };

    if (this.userData.plainPassword && this.userData.plainPassword.trim() !== '') {
      payload.plainPassword = this.userData.plainPassword;
    }

    this.http
      .patch(`http://127.0.0.1:8000/api/users/${this.userId}`, payload, { headers })
      .subscribe({
        next: () => {
          this.successMessage = 'Profil mis a jour avec succes !';
          this.userData.plainPassword = '';
          this.isSaving = false; // On reactive le bouton
          this.cdr.detectChanges(); // On s'assure que Angular rafraîchit l'affichage après la mise à jour de l'état de sauvegarde et du message de succès

          // On fait disparaitre le message apres 4 secondes
          setTimeout(() => {
            this.successMessage = '';
          }, 4000);
        },
        error: (err) => {
          this.errorMessage = 'Une erreur est survenue lors de la sauvegarde.';
          this.isSaving = false; // On reactive le bouton
          this.cdr.detectChanges(); // On s'assure que Angular rafraîchit l'affichage après la mise à jour de l'état de sauvegarde et du message d'erreur
        },
      });
  }
}
