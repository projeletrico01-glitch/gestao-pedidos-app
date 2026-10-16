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
  machines: Machine[];
  panel: PanelSpecification;
  accessories: CodeItem[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  appSheet: 'SIM' | 'NÃO';
  status: OrderStatus;
  deliveryDate: string; // YYYY-MM-DD
  notes: string;
  createdAt: string;
  environments: Environment[];
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
