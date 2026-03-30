import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class NavbarComponent implements OnInit {
  userName: string = 'Pilote';
  isProfileMenuOpen = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.extractUserName();
  }

  // Nouvelle fonction pour lire le contenu du token Symfony
  extractUserName() {
    const token = localStorage.getItem('car_token');
    if (token) {
      try {
        // Un JWT est compose de 3 parties separees par des points. La partie 2 contient les donnees.
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Adapte 'username' selon ce que ton API Platform renvoie (ca peut aussi etre 'email')
        if (payload.username) {
          this.userName = payload.username;
        } else if (payload.email) {
          // Si on n'a que l'email, on prend la partie avant le @
          this.userName = payload.email.split('@')[0];
        }
      } catch (e) {
        console.error('Erreur lors du decodage du token', e);
      }
    }
  }

  // Ouvre et ferme le menu deroulant
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  // Deconnecte l'utilisateur
  logout() {
    localStorage.removeItem('car_token');
    this.router.navigate(['/login']);
  }
}
