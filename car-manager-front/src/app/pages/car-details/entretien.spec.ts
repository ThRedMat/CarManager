import { TestBed } from '@angular/core/testing';

import { Entretien } from './entretien';

describe('Entretien', () => {
  let service: Entretien;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Entretien);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
