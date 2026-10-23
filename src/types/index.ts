export type OrderStatus = 'Pendente' | 'Pronto' | 'Entregue';

export interface CodeItem {
  code: string;
  name: string;
  unit?: string;
  quantity?: number;
  notes?: string;
}

export interface Machine {
  id: string;
  name: string;
  quantity: number;
  items: CodeItem[];
}

export interface PanelSpecification {
  description: string;
  items: CodeItem[];
}

export interface Environment {
  id: string;
  name: string;
  operatingTemperature?: string; // Temperatura de operação (ex: -18°C, +2°C a +4°C)
  evaporatorDistance?: string; // Distância da evaporadora para condensadora (ex: 15m)
  machineModelCode?: string; // Código de nomenclatura da máquina (ex: MTM420S01H9F0G3P0P1100411000NP)
  panelModelCode?: string; // Código de nomenclatura do quadro de comando (ex: QFBTU1100I00C3B0G1P0P5 ou QC04350100P102)
  machines: Machine[];
  panel: PanelSpecification;
  accessories: CodeItem[];
}

export interface ExcludedComponentItem {
  code: string;
  name: string;
  reason?: string;
  excludedAt?: string;
  from?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  appSheet: 'SIM' | 'NÃO';
  supervisory?: 'SIM' | 'NÃO'; // Configuração se possui supervisório
  status: OrderStatus;
  deliveryDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string;
  environments: Environment[];
  excludedComponents?: ExcludedComponentItem[];
}

export interface CatalogItem {
  code: string;
  name: string;
  category: string;
  unit?: string;
  price?: number;
}

export type ViewMode = 'table' | 'kanban' | 'calendar';

export type LayoutMode = 'sidebar' | 'topbar';
export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';
export type EnvironmentDisplayMode = 'tabs' | 'cards';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
