import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // <--- 1. IMPORTE ÇA
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  //private http = inject(HttpClient);
  //private cd = inject(ChangeDetectorRef); // <--- 2. INJECTE LE DÉTECTEUR
  isEditingKm = false;
  editKmValue: number = 0;
  selectedCarId: number | null = null;
  cars: any[] = [];
  isModalOpen = false;
  isProfileMenuOpen = false;
  currentCarIndex = 0;
  userName: string = 'Pilote';
  isBlurred: boolean = true; // Nouvelle variable pour gérer le flou

  toggleBlur() {
    this.isBlurred = !this.isBlurred;
  }

  newCar = {
    brand: '',
    model: '',
    licensePlate: '',
    currentKm: 0,
    nextServiceKm: 0,
    nextCtDate: '',
  };

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit() {
    this.extractUserName();
    this.loadCars();
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

  loadCars() {
    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // On ajoute ?t= suivi de l'heure actuelle pour tromper le cache du navigateur
    const cacheBuster = `?t=${new Date().getTime()}`;

    this.http.get<any>(`http://127.0.0.1:8000/api/cars${cacheBuster}`, { headers }).subscribe({
      next: (data) => {
        if (data['hydra:member']) {
          this.cars = data['hydra:member'];
        } else if (Array.isArray(data.member)) {
          this.cars = data.member;
        } else {
          this.cars = [];
        }

        // Sécurité : si on supprime la dernière voiture, on revient à l'index 0
        if (this.currentCarIndex >= this.cars.length) {
          this.currentCarIndex = Math.max(0, this.cars.length - 1);
        }

        this.cd.detectChanges();
      },
    });
  }

  // Nouvelle variable pour stocker le fichier choisi
  selectedFile: File | null = null;

  // Fonction déclenchée quand on choisit une image
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Modification de la fonction de sauvegarde
  saveCar() {
    const token = localStorage.getItem('car_token');

    // ATTENTION : Avec FormData, il ne faut surtout PAS forcer le Content-Type.
    // Le navigateur va le définir tout seul en multipart/form-data.
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // On crée le FormData
    const formData = new FormData();
    formData.append('brand', this.newCar.brand);
    formData.append('model', this.newCar.model);
    formData.append('licensePlate', this.formatLicensePlate(this.newCar.licensePlate));
    formData.append('currentKm', this.newCar.currentKm.toString());
    formData.append('nextServiceKm', this.newCar.nextServiceKm.toString());

    if (this.newCar.nextCtDate) {
      formData.append('nextCtDate', this.newCar.nextCtDate);
    }

    // Si une image a été sélectionnée, on l'ajoute
    if (this.selectedFile) {
      formData.append('imageFile', this.selectedFile);
    }

    // On envoie le formData au lieu de l'objet classique
    this.http.post('http://127.0.0.1:8000/api/cars', formData, { headers }).subscribe({
      next: (res) => {
        this.closeModal();
        this.loadCars();
        // Reset complet
        this.newCar = {
          brand: '',
          model: '',
          licensePlate: '',
          currentKm: 0,
          nextServiceKm: 0,
          nextCtDate: '',
        };
        this.selectedFile = null;
        this.cd.detectChanges();
      },
      error: (err) => alert('Erreur lors de la sauvegarde du véhicule.'),
    });
  }

  openModal() {
    this.isModalOpen = true;
    this.cd.detectChanges(); // Optionnel : force l'ouverture visuelle
  }

  closeModal() {
    this.isModalOpen = false;
    this.cd.detectChanges(); // Optionnel : force la fermeture visuelle
  }

  getCarImage(car: any): string {
    if (!car) return '';

    // Si la voiture possède une image uploadée, on retourne son chemin complet
    if (car.imageName) {
      // Ajuste l'URL de base selon la configuration de ton dossier public Symfony
      return `http://127.0.0.1:8000/uploads/cars/${car.imageName}`;
    }

    // Sinon, comportement de secours classique
    const brand = car.brand ? car.brand.toLowerCase() : '';
    const model = car.model ? car.model.toLowerCase() : '';

    if (brand === 'tesla') return 'https://pngimg.com/d/tesla_car_PNG47.png';
    if (brand === 'ford' && model.includes('fiesta')) return 'images/fiesta.png';
    if (brand === 'peugeot') return 'https://pngimg.com/uploads/peugeot/peugeot_PNG24.png';
    if (brand === 'audi') return 'images/audi.png';

    return 'https://cdn-icons-png.flaticon.com/512/3204/3204003.png';
  }

  formatLicensePlate(plate: string): string {
    if (!plate) return '';

    let clean = plate.replace(/[-\s\·]/g, '').toUpperCase();

    if (clean.length === 7 && /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(clean)) {
      let part1 = clean.substring(0, 2);
      let part2 = clean.substring(2, 5);
      let part3 = clean.substring(5, 7);

      if (this.isBlurred) {
        part2 = '***';
      }

      return `${part1}·${part2}·${part3}`;
    }

    if (this.isBlurred && clean.length > 2) {
      return clean.substring(0, 1) + '***' + clean.substring(clean.length - 1);
    }

    return clean;
  }

  startEditKm(car: any) {
    if (!car) return;
    this.selectedCarId = car.id;
    this.editKmValue = car.currentKm; // On pre-remplit avec le km actuel
    this.isEditingKm = true;
    this.cd.detectChanges();
  }

  saveKm() {
    if (!this.selectedCarId || this.editKmValue <= 0) {
      this.isEditingKm = false;
      return;
    }

    const carToUpdate = this.cars.find((c) => c.id === this.selectedCarId);
    if (!carToUpdate) {
      this.isEditingKm = false;
      return;
    }

    // NOUVELLE SÉCURITÉ : On bloque si le kilométrage est inférieur à l'actuel
    if (this.editKmValue < carToUpdate.currentKm) {
      alert('Erreur : Le nouveau kilométrage ne peut pas être inférieur au kilométrage actuel.');
      this.isEditingKm = false;
      return;
    }

    // Si on a tapé le même chiffre, on ferme juste la zone de texte
    if (carToUpdate.currentKm === this.editKmValue) {
      this.isEditingKm = false;
      return;
    }

    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/merge-patch+json',
    });

    const body = {
      currentKm: Number(this.editKmValue),
    };

    this.http
      .patch(`http://127.0.0.1:8000/api/cars/${this.selectedCarId}`, body, { headers })
      .subscribe({
        next: () => {
          this.isEditingKm = false;
          this.loadCars();
        },
        error: (err) => {
          console.error('Erreur de mise à jour', err);
          this.isEditingKm = false;
        },
      });
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.cd.detectChanges();
  }

  logout() {
    localStorage.removeItem('car_token');
    this.router.navigate(['/login']);
  }
  nextCar() {
    if (this.currentCarIndex < this.cars.length - 1) {
      this.currentCarIndex++;
      this.cd.detectChanges();
    }
  }

  prevCar() {
    if (this.currentCarIndex > 0) {
      this.currentCarIndex--;
      this.cd.detectChanges();
    }
  }

  // Calcule le nombre de jours restants avant le CT
  getDaysUntilCt(car: any): number {
    if (!car || !car.nextCtDate) return -1; // -1 signifie "Pas de date définie"

    const ctDate = new Date(car.nextCtDate);
    const today = new Date();

    // On efface les heures pour avoir une différence de jours stricte
    today.setHours(0, 0, 0, 0);
    ctDate.setHours(0, 0, 0, 0);

    const diffTime = ctDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Gère l'affichage visuel du widget CT
  getCtStatus(car: any): { colorClass: string; text: string; dasharray: string } {
    const days = this.getDaysUntilCt(car);

    if (days === -1) {
      return { colorClass: 'grey', text: 'A définir', dasharray: '0, 100' };
    }

    if (days < 0) {
      return { colorClass: 'red', text: 'Dépassé', dasharray: '100, 100' };
    }

    // La jauge se remplit à mesure qu'on approche du jour J (calculé sur 1 an max)
    const maxDays = 365;
    const urgencyPercentage = days > maxDays ? 0 : 100 - (days / maxDays) * 100;
    const dasharray = `${Math.round(urgencyPercentage)}, 100`;

    if (days <= 30) {
      return { colorClass: 'red', text: `J-${days}`, dasharray };
    } else if (days <= 90) {
      return { colorClass: 'orange', text: `J-${days}`, dasharray };
    } else {
      return { colorClass: 'green', text: `J-${days}`, dasharray };
    }
  }

  // --- NOUVELLE FONCTION AJOUTÉE ICI ---
  getProgressBarWidth(car: any): string {
    if (!car) return '0%';
    const remainingKm = car.nextServiceKm - car.currentKm;
    const standardInterval = 20000;

    if (remainingKm <= 0) return '100%';
    if (remainingKm >= standardInterval) return '0%';

    const consumedKm = standardInterval - remainingKm;
    const percentage = (consumedKm / standardInterval) * 100;

    return `${Math.round(percentage)}%`;
  }
  // -------------------------------------

  deleteCar() {
    const car = this.cars[this.currentCarIndex];
    if (!car) return;

    if (confirm(`Voulez-vous vraiment retirer la ${car.brand} ${car.model} du garage ?`)) {
      const token = localStorage.getItem('car_token');

      // LE CORRECTIF EST ICI : On ajoute le format Accept: application/ld+json
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/ld+json',
      });

      this.http.delete(`http://127.0.0.1:8000/api/cars/${car.id}`, { headers }).subscribe({
        next: () => {
          // 1. On retire la voiture de l'affichage immediatement
          this.cars.splice(this.currentCarIndex, 1);

          // 2. On recule l'index pour ne pas faire planter le carrousel
          if (this.currentCarIndex > 0) {
            this.currentCarIndex--;
          }

          // 3. On demande au serveur la liste mise a jour
          this.loadCars();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression :', err);
          alert('Impossible de supprimer le véhicule.');
        },
      });
    }
  }

  goToGarage(carId: number) {
    this.router.navigate(['/car', carId]);
  }
}
