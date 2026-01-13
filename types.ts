
export enum ApplicationType {
  PULVERIZACAO = 'Pulverização',
  DISPERSAO = 'Dispersão de Sólidos'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface Area {
  id: string;
  name: string;
  hectares: number;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
  areas: Area[];
  isPartner?: boolean;
  partnerName?: 'Kaká' | 'Patrick' | 'Geraldo';
}

export interface ServiceRecord {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  areaId: string;
  areaName: string;
  hectares: number;
  type: ApplicationType;
  unitPrice: number;
  totalValue: number;
  closed?: boolean;
}

export interface AgendaItem {
  id: string;
  date: string;
  clientId: string;
  clientName: string;
  areaId: string;
  areaName: string;
  hectares: number;
  type: ApplicationType;
  notes?: string;
  createdBy: string;
  status: 'pending' | 'confirmed';
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  closed?: boolean;
}

export interface Contribution {
  id: string;
  partnerName: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface PartnerSummary {
  name: string;
  shortName: string;
  grossProfit: number;
  deductions: number;
  netProfit: number;
  salary?: number;
  hectares?: number;
}

export interface ClosedMonth {
  id: string;
  monthYear: string; // Formato "M/YYYY"
  label: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  hectares: number;
  services: ServiceRecord[];
  expenses: Expense[];
  partnerSummaries: PartnerSummary[];
  closedAt: string;
}

export interface DashboardStats {
  hectaresMonth: number;
  hectaresYear: number;
  balanceMonth: number;
  balanceYear: number;
  bankBalance: number;
}
