import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Entretien {
  id: number;
  type: string;
  libelle: string;
  dateRealisation: string | null;
  dateProchaine: string | null;
  kmRealise: number | null;
  kmProchain: number | null;
  garage: string | null;
  montant: number | null;
  statut: 'ok' | 'warn' | 'alert';
  invoiceName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EntretienService {
  private http = inject(HttpClient);

  getEntretiensByCar(carId: number): Observable<any> {
    // On récupère le token depuis le localStorage (même clé que dans car-details.ts)
    const token = localStorage.getItem('car_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/ld+json',
    });

    return this.http.get(`http://127.0.0.1:8000/api/entretiens?car.id=${carId}`, { headers });
  }
}
