import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historique.html',
  styleUrls: ['./historique.scss'],
})
export class Historique implements OnInit {
  // Données
  entretiens: any[] = [];
  cars: any[] = [];
  selectedCarId: string = '';

  // Etats globaux
  isLoading: boolean = true;
  errorMessage: string = '';

  // Etats du formulaire
  showForm: boolean = false;
  isSaving: boolean = false;
  formSuccess: string = '';
  formError: string = '';
  selectedFile: File | null = null;

  // Objet de saisie du nouvel entretien
  newEntretien = {
    carId: '',
    type: '',
    libelle: '',
    dateRealisation: '',
    kmRealise: '',
    montant: '',
    garage: '',
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const token = localStorage.getItem('car_token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });

    // 1. On charge d'abord les voitures pour le menu déroulant
    this.http.get<any>('http://127.0.0.1:8000/api/cars', { headers }).subscribe({
      next: (carData) => {
        this.cars = carData['hydra:member'] || carData || [];

        // 2. Ensuite on charge les entretiens
        this.http.get<any>('http://127.0.0.1:8000/api/entretiens', { headers }).subscribe({
          next: (entData) => {
            this.entretiens = entData['hydra:member'] || entData || [];
          },
          error: (err) => {
            console.error('Erreur entretiens:', err);
            this.errorMessage = "Impossible de charger l'historique.";
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          complete: () => {
            this.isLoading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: (err) => {
        console.error('Erreur voitures:', err);
        this.errorMessage = 'Impossible de charger vos véhicules.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // Filtre la liste des entretiens selon la voiture choisie dans le menu
  get filteredEntretiens() {
    if (!this.selectedCarId) {
      return this.entretiens;
    }
    return this.entretiens.filter((item) => {
      const carId = typeof item.car === 'string' ? item.car.split('/').pop() : item.car?.id;
      return carId?.toString() === this.selectedCarId;
    });
  }

  // Permet d'afficher le nom complet de la voiture dans le tableau
  getCarName(carData: any): string {
    if (!carData) return '-';
    const carId = typeof carData === 'string' ? carData.split('/').pop() : carData.id;
    const foundCar = this.cars.find((c) => c.id?.toString() === carId?.toString());
    return foundCar ? `${foundCar.brand} ${foundCar.model}` : `Vehicule ${carId}`;
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  // Ouvre ou ferme le formulaire d'ajout
  toggleForm() {
    this.showForm = !this.showForm;
    this.formSuccess = '';
    this.formError = '';
  }

  // Capture le fichier sélectionné par l'utilisateur
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Enregistre le nouvel entretien avec son fichier
  saveEntretien() {
    this.formError = '';
    this.formSuccess = '';

    // Validation basique
    if (!this.newEntretien.carId || !this.newEntretien.type || !this.newEntretien.dateRealisation) {
      this.formError = 'Veuillez remplir au moins le véhicule, le type et la date.';
      return;
    }

    this.isSaving = true;
    const token = localStorage.getItem('car_token');

    // Pas de Content-Type ici, le navigateur gère le multipart/form-data automatiquement
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Construction du payload avec FormData pour gérer le fichier
    const formData = new FormData();
    formData.append('car', this.newEntretien.carId);
    formData.append('type', this.newEntretien.type);
    formData.append('dateRealisation', this.newEntretien.dateRealisation);

    formData.append(
      'libelle',
      this.newEntretien.libelle ? this.newEntretien.libelle : this.newEntretien.type,
    );
    if (this.newEntretien.kmRealise)
      formData.append('kmRealise', this.newEntretien.kmRealise.toString());
    if (this.newEntretien.montant) formData.append('montant', this.newEntretien.montant.toString());
    if (this.newEntretien.garage) formData.append('garage', this.newEntretien.garage);
    if (this.selectedFile) formData.append('invoiceFile', this.selectedFile);

    this.http.post('http://127.0.0.1:8000/api/entretiens', formData, { headers }).subscribe({
      next: () => {
        this.formSuccess = 'Intervention enregistrée avec succès !';
        this.isSaving = false;
        this.cdr.detectChanges();

        // On recharge les données pour afficher la nouvelle ligne
        this.loadData();

        // On referme le formulaire après 2 secondes et on réinitialise
        setTimeout(() => {
          this.showForm = false;
          this.newEntretien = {
            carId: '',
            type: '',
            libelle: '',
            dateRealisation: '',
            kmRealise: '',
            montant: '',
            garage: '',
          };
          this.selectedFile = null;
        }, 2000);
      },
      error: (err) => {
        console.error('Erreur sauvegarde:', err);
        this.formError = "Erreur lors de l'enregistrement de l'intervention.";
        this.isSaving = false;
        this.cdr.detectChanges();
      },
    });
  }
}
