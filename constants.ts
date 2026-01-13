
import { Client } from './types';

export const GERALDO_SALARY = 5000;
export const PARTNER_SERVICE_RATE = 100; // Dedução por hectare para Kaká e Patrick

export const PARTNERS = [
  { name: 'Kaká', fullName: 'Kaká (Sócio)', color: 'blue' },
  { name: 'Patrick', fullName: 'Patrick (Sócio)', color: 'indigo' },
  { name: 'Geraldo', fullName: 'Geraldo Júnior', color: 'emerald' },
  { name: 'Reserva', fullName: 'Fundo de Reserva', color: 'amber' }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Fazenda Boa Vista (Kaká)',
    contact: '(64) 99200-0000',
    isPartner: true,
    partnerName: 'Kaká',
    areas: [
      { id: 'a1', name: 'Talhão 01 - Sede', hectares: 45.5 },
      { id: 'a2', name: 'Talhão 02 - Mata', hectares: 32.8 }
    ]
  },
  {
    id: 'c2',
    name: 'Fazenda Progresso (Patrick)',
    contact: '(64) 99300-0000',
    isPartner: true,
    partnerName: 'Patrick',
    areas: [
      { id: 'a3', name: 'Grotão 01', hectares: 110.2 }
    ]
  },
  {
    id: 'c3',
    name: 'Produtor Independente Silva',
    contact: '(62) 99999-9999',
    isPartner: false,
    areas: [
      { id: 'a4', name: 'Área Sul', hectares: 25.0 }
    ]
  }
];
