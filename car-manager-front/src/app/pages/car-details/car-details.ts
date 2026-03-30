import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { EntretienService, Entretien } from './entretien';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './car-details.html',
  styleUrls: ['./car-details.scss'],
})
export class CarDetails implements OnInit {
  car: any = null;
  entretiens: Entretien[] = [];
  selectedEntretien: Entretien | null = null;

  // Gestion du filtrage et de l'affichage
  activeTableFilter: string | null = null; // null = tout afficher
  isAdding: boolean = false;
  isEditing: boolean = false;
  addingPartType: string = '';
  newEntretien: any = {};
  selectedFile: File | null = null;

  readonly UPLOADS_URL = 'http://127.0.0.1:8000/uploads/invoices/';

  currentView: 'exterior' | 'engine' = 'exterior';
  piecesExterieures: string[] = ['phares', 'pneus', 'freins', 'ct', 'autre'];
  piecesMoteur: string[] = ['huile', 'filtres', 'batterie', 'courroie', 'clim'];

  // Dictionnaire des positions par marque
  allHotspotPositions: { [brand: string]: { [key: string]: { top: string; left: string } } } = {
    default: {
      phares: { top: '55%', left: '45%' },
      pneus: { top: '76%', left: '59%' },
      freins: { top: '65%', left: '90%' },
      ct: { top: '48%', left: '30%' },
      autre: { top: '50%', left: '50%' },
      huile: { top: '45%', left: '49%' },
      filtres: { top: '49%', left: '65%' },
      batterie: { top: '60%', left: '16%' },
      courroie: { top: '70%', left: '46%' },
      clim: { top: '64%', left: '79%' },
    },
    tesla: {
      phares: { top: '45%', left: '20%' },
      pneus: { top: '70%', left: '32%' },
      freins: { top: '64%', left: '81%' },
      ct: { top: '25%', left: '39%' },
      autre: { top: '50%', left: '50%' },
      huile: { top: '45%', left: '49%' },
      filtres: { top: '49%', left: '65%' },
      batterie: { top: '60%', left: '16%' },
      courroie: { top: '70%', left: '46%' },
      clim: { top: '64%', left: '79%' },
    },
    audi: {
      phares: { top: '48%', left: '38%' },
      pneus: { top: '61%', left: '54%' },
      freins: { top: '57%', left: '89%' },
      ct: { top: '34%', left: '57%' },
      autre: { top: '47%', left: '69%' },
      huile: { top: '45%', left: '49%' },
      filtres: { top: '49%', left: '65%' },
      batterie: { top: '60%', left: '16%' },
      courroie: { top: '70%', left: '46%' },
      clim: { top: '64%', left: '79%' },
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private entretienService: EntretienService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCar(id);
    }
  }

  loadCar(id: string) {
    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/ld+json',
    });

    this.http.get<any>(`http://127.0.0.1:8000/api/cars/${id}`, { headers }).subscribe({
      next: (data) => {
        this.car = data;
        this.entretiens = data.entretiens || [];
        setTimeout(() => this.cd.detectChanges(), 10);
      },
      error: (err) => console.error('Erreur chargement voiture :', err),
    });
  }

  // Getter intelligent pour le tableau (tri + filtre contextuel)
  get sortedEntretiens(): Entretien[] {
    let list = [...this.entretiens];

    if (this.activeTableFilter) {
      list = list.filter((e) => e.type.toLowerCase() === this.activeTableFilter?.toLowerCase());
    }

    return list.sort((a, b) => {
      const dateA = new Date(a.dateRealisation || 0).getTime();
      const dateB = new Date(b.dateRealisation || 0).getTime();
      return dateB - dateA;
    });
  }

  get currentTypesEntretien(): string[] {
    return this.currentView === 'exterior' ? this.piecesExterieures : this.piecesMoteur;
  }

  switchView(view: 'exterior' | 'engine') {
    this.currentView = view;
    this.resetTableFilter();
  }

  // Recherche insensible a la casse pour les pastilles de couleur
  getEntretienByType(type: string): Entretien | undefined {
    return [...this.entretiens]
      .filter((e) => e.type.toLowerCase() === type.toLowerCase())
      .sort(
        (a, b) =>
          new Date(b.dateRealisation || 0).getTime() - new Date(a.dateRealisation || 0).getTime(),
      )[0];
  }

  getStatutByType(type: string): string {
    const entretien = this.getEntretienByType(type);
    return entretien ? (entretien as any).statut : 'default';
  }

  getHotspotStyle(type: string) {
    if (!this.car) return { display: 'none' };
    const brand = this.car.brand ? this.car.brand.toLowerCase() : 'default';
    const positionsForBrand =
      this.allHotspotPositions[brand] || this.allHotspotPositions['default'];
    const pos = positionsForBrand[type];
    return pos ? { top: pos.top, left: pos.left } : { display: 'none' };
  }

  openDetail(type: string) {
    this.activeTableFilter = type; // On filtre le tableau au clic
    const entretien = this.getEntretienByType(type);

    if (entretien) {
      this.selectedEntretien = entretien;
      this.isAdding = false;
      this.isEditing = false;
    } else {
      this.selectedEntretien = null;
      this.isAdding = true;
      this.isEditing = false;
      this.addingPartType = type;
      this.newEntretien = {
        type: type,
        libelle: 'Remplacement ' + type,
        dateRealisation: new Date().toISOString().split('T')[0],
        kmRealise: this.car?.currentKm || 0,
        garage: '',
        montant: null,
      };
    }
    this.cd.detectChanges();
  }

  closeDetail() {
    this.selectedEntretien = null;
    this.isAdding = false;
    this.isEditing = false;
    this.selectedFile = null;
    this.cd.detectChanges();
  }

  resetTableFilter() {
    this.activeTableFilter = null;
    this.closeDetail();
  }
  openGenericAdd() {
    this.selectedEntretien = null;
    this.isAdding = true;
    this.isEditing = false;
    this.addingPartType = ''; // Permet a l'utilisateur de saisir la categorie manuellement
    this.activeTableFilter = null; // Affiche tout le tableau

    this.newEntretien = {
      type: '',
      libelle: '',
      dateRealisation: new Date().toISOString().split('T')[0],
      kmRealise: this.car?.currentKm || 0,
      garage: '',
      montant: null,
    };
    this.cd.detectChanges();
  }

  editEntretien() {
    this.isEditing = true;
    this.isAdding = false;
    this.newEntretien = { ...this.selectedEntretien };
    if (this.newEntretien.dateRealisation) {
      this.newEntretien.dateRealisation = this.newEntretien.dateRealisation.split('T')[0];
    }
    this.cd.detectChanges();
  }

  deleteEntretien() {
    if (!this.selectedEntretien || !this.selectedEntretien.id) return;
    if (confirm('Voulez-vous vraiment supprimer cet entretien ?')) {
      const token = localStorage.getItem('car_token');
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
      this.http
        .delete(`http://127.0.0.1:8000/api/entretiens/${this.selectedEntretien.id}`, { headers })
        .subscribe({
          next: () => {
            this.resetTableFilter();
            this.loadCar(this.car.id.toString());
          },
          error: (err) => console.error('Erreur suppression :', err),
        });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  saveEntretien() {
    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const formData = new FormData();

    formData.append('type', this.newEntretien.type);
    formData.append('libelle', this.newEntretien.libelle);
    formData.append('dateRealisation', this.newEntretien.dateRealisation);
    formData.append('car', `/api/cars/${this.car.id}`);

    if (this.newEntretien.kmRealise)
      formData.append('kmRealise', this.newEntretien.kmRealise.toString());
    if (this.newEntretien.garage) formData.append('garage', this.newEntretien.garage);
    if (this.newEntretien.montant) formData.append('montant', this.newEntretien.montant.toString());
    if (this.selectedFile) formData.append('invoiceFile', this.selectedFile);

    this.http.post('http://127.0.0.1:8000/api/entretiens', formData, { headers }).subscribe({
      next: () => {
        this.resetTableFilter();
        this.loadCar(this.car.id.toString());
      },
      error: (err) => console.error('Erreur sauvegarde :', err),
    });
  }

  updateEntretien() {
    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/merge-patch+json',
    });

    const payload = {
      libelle: this.newEntretien.libelle,
      dateRealisation: this.newEntretien.dateRealisation,
      kmRealise: this.newEntretien.kmRealise,
      garage: this.newEntretien.garage,
      montant: this.newEntretien.montant,
    };

    this.http
      .patch(`http://127.0.0.1:8000/api/entretiens/${this.newEntretien.id}`, payload, { headers })
      .subscribe({
        next: () => {
          this.isEditing = false;
          this.loadCar(this.car.id.toString());
        },
        error: (err) => console.error('Erreur modification :', err),
      });
  }

  getInvoiceUrl(filename: string): string {
    return this.UPLOADS_URL + filename;
  }

  isPdf(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  getClickCoordinates(event: MouseEvent) {
    const target = event.target as HTMLImageElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const leftPercent = (x / rect.width) * 100;
    const topPercent = (y / rect.height) * 100;
    console.warn(
      `COORDONNÉES -> ${this.currentView} | top: '${topPercent.toFixed(0)}%', left: '${leftPercent.toFixed(0)}%'`,
    );
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  getMainImage(): string {
    if (this.currentView === 'engine') return 'images/moteur-generique.jpg';
    if (this.car) {
      if (this.car.imageName) return `http://127.0.0.1:8000/uploads/cars/${this.car.imageName}`;
      const brand = this.car.brand?.toLowerCase();
      const model = this.car.model?.toLowerCase();
      if (brand === 'tesla') return 'https://pngimg.com/d/tesla_car_PNG47.png';
      if (brand === 'ford' && model?.includes('fiesta')) return 'images/fiesta.png';
      if (brand === 'peugeot') return 'https://pngimg.com/uploads/peugeot/peugeot_PNG24.png';
      if (brand === 'audi') return 'images/audi.png';
    }
    return 'https://cdn-icons-png.flaticon.com/512/3204/3204003.png';
  }

  exportToPDF() {
    if (!this.car) return;

    // 1. Initialisation du document PDF
    const doc = new jsPDF();

    // 2. Ajout du titre
    const title = `Carnet d'entretien - ${this.car.brand} ${this.car.model}`;
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39); // Gris très foncé
    doc.text(title, 14, 22);

    // 3. Préparation des colonnes et des lignes
    const head = [['Date', 'Intervention', 'Garage', 'Kilometrage', 'Cout']];

    // On utilise this.entretiens pour avoir TOUT l'historique, sans le filtre actif
    // On le trie du plus récent au plus ancien
    const allEntretiensSorted = [...this.entretiens].sort((a, b) => {
      return (
        new Date(b.dateRealisation || 0).getTime() - new Date(a.dateRealisation || 0).getTime()
      );
    });

    const data = allEntretiensSorted.map((item) => [
      new Date(item.dateRealisation || 0).toLocaleDateString('fr-FR'),
      `${item.type.toUpperCase()}\n${item.libelle}`,
      item.garage || '-',
      item.kmRealise ? `${item.kmRealise} km` : '-',
      item.montant ? `${item.montant} EUR` : '-',
    ]);

    // 4. Génération du tableau dans le PDF
    autoTable(doc, {
      startY: 30,
      head: head,
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [17, 24, 39] }, // En-tête de tableau noir pour rester dans ton thème
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    // 5. Sauvegarde et téléchargement automatique
    const fileName = `Carnet_${this.car.brand}_${this.car.model}.pdf`.replace(/\s+/g, '_');
    doc.save(fileName);
  }
}
