import { CatalogItem, Order } from '../types';

export const initialCatalogData: CatalogItem[] = [
  { code: 'COMP-01', name: 'Compressor Scroll 5HP R410A 220V', category: 'Máquinas', unit: 'UN' },
  { code: 'COMP-02', name: 'Compressor Hermético 3HP R404A 220V', category: 'Máquinas', unit: 'UN' },
  { code: 'COMP-03', name: 'Compressor Semi-Hermético 10HP 380V', category: 'Máquinas', unit: 'UN' },
  { code: 'DISJ-16', name: 'Disjuntor Bipolar DIN 16A Curva C', category: 'Quadros', unit: 'UN' },
  { code: 'DISJ-25', name: 'Disjuntor Bipolar DIN 25A Curva C', category: 'Quadros', unit: 'UN' },
  { code: 'DISJ-32', name: 'Disjuntor Trifásico DIN 32A Curva C', category: 'Quadros', unit: 'UN' },
  { code: 'DISJ-63', name: 'Disjuntor Caixa Moldada 63A 3P', category: 'Quadros', unit: 'UN' },
  { code: 'CONT-09', name: 'Contator Trifásico 9A 220V (1NA)', category: 'Componentes', unit: 'UN' },
  { code: 'CONT-18', name: 'Contator Trifásico 18A 220V (1NA)', category: 'Componentes', unit: 'UN' },
  { code: 'CONT-32', name: 'Contator Trifásico 32A 220V (1NA+1NF)', category: 'Componentes', unit: 'UN' },
  { code: 'RELE-TER', name: 'Relé Térmico de Sobrecarga 12-18A', category: 'Componentes', unit: 'UN' },
  { code: 'INV-7.5', name: 'Inversor de Frequência 7.5HP 380V Trifásico', category: 'Quadros', unit: 'UN' },
  { code: 'INV-10', name: 'Inversor de Frequência 10HP 380V Trifásico', category: 'Quadros', unit: 'UN' },
  { code: 'SOFT-15', name: 'Soft-Starter 15CV 380V c/ Bypass', category: 'Quadros', unit: 'UN' },
  { code: 'CLP-01', name: 'Módulo CLP Siemens S7-1200 CPU 1214C', category: 'Quadros', unit: 'UN' },
  { code: 'IHM-07', name: 'IHM Touch Screen Colorida 7" Ethernet', category: 'Quadros', unit: 'UN' },
  { code: 'SENS-NTC', name: 'Sensor de Temperatura NTC 10k 1.5m Inox', category: 'Acessórios', unit: 'UN' },
  { code: 'SENS-PT100', name: 'Transmissor de Temperatura PT100 4-20mA', category: 'Acessórios', unit: 'UN' },
  { code: 'TRANSD-P', name: 'Transdutor de Pressão 0-500 PSI 4-20mA', category: 'Acessórios', unit: 'UN' },
  { code: 'VALV-3V', name: 'Válvula de 3 Vias Motorizada Proporcional 3/4"', category: 'Acessórios', unit: 'UN' },
  { code: 'VALV-EXP', name: 'Válvula de Expansão Eletrônica 3/8"', category: 'Acessórios', unit: 'UN' },
  { code: 'FILT-G4', name: 'Filtro de Ar Lavável G4 500x500mm', category: 'Acessórios', unit: 'UN' },
  { code: 'DUTO-200', name: 'Duto Flexível Alumínio Isolado 200mm', category: 'Acessórios', unit: 'M' },
  { code: 'QUADRO-MET', name: 'Quadro Metálico Sobrepor 600x400x250mm IP65', category: 'Quadros', unit: 'UN' },
  { code: 'CABO-4MM', name: 'Cabo Flexível 4.0mm² 750V (Cobre)', category: 'Componentes', unit: 'M' }
];

export function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const initialOrdersData: Order[] = [
  {
    id: 'ord-1024',
    orderNumber: 'PV-1024',
    customer: 'Clínica Saúde & Vida Ltda',
    appSheet: 'SIM',
    status: 'Pendente',
    deliveryDate: getRelativeDate(3),
    notes: 'Entrega na recepção central. Montagem e teste funcional do quadro de comando antes da liberação final.',
    createdAt: new Date().toISOString(),
    environments: [
      {
        id: 'env-101',
        name: 'Recepção Principal',
        machines: [
          {
            id: 'm-1',
            name: 'Chiller de Precisão 5TR',
            quantity: 1,
            items: [
              { code: 'COMP-01', name: 'Compressor Scroll 5HP R410A 220V' },
              { code: 'VALV-EXP', name: 'Válvula de Expansão Eletrônica 3/8"' }
            ]
          }
        ],
        panel: {
          description: 'Quadro Trifásico 380V c/ CLP Siemens e Partida Suave',
          items: [
            { code: 'DISJ-32', name: 'Disjuntor Trifásico DIN 32A Curva C' },
            { code: 'CONT-32', name: 'Contator Trifásico 32A 220V (1NA+1NF)' },
            { code: 'INV-7.5', name: 'Inversor de Frequência 7.5HP 380V Trifásico' },
            { code: 'CLP-01', name: 'Módulo CLP Siemens S7-1200 CPU 1214C' }
          ]
        },
        accessories: [
          { code: 'SENS-NTC', name: 'Sensor de Temperatura NTC 10k 1.5m Inox' },
          { code: 'FILT-G4', name: 'Filtro de Ar Lavável G4 500x500mm' }
        ]
      },
      {
        id: 'env-102',
        name: 'Sala de Exames Tomografia',
        machines: [
          {
            id: 'm-2',
            name: 'Fan Coil Hidrônico 3TR',
            quantity: 2,
            items: [
              { code: 'VALV-3V', name: 'Válvula de 3 Vias Motorizada Proporcional 3/4"' },
              { code: 'FILT-G4', name: 'Filtro de Ar Lavável G4 500x500mm' }
            ]
          }
        ],
        panel: {
          description: 'Painel de Comando Secundário 220V',
          items: [
            { code: 'DISJ-16', name: 'Disjuntor Bipolar DIN 16A Curva C' },
            { code: 'CONT-09', name: 'Contator Trifásico 9A 220V (1NA)' }
          ]
        },
        accessories: [
          { code: 'SENS-PT100', name: 'Transmissor de Temperatura PT100 4-20mA' }
        ]
      }
    ]
  },
  {
    id: 'ord-1025',
    orderNumber: 'PV-1025',
    customer: 'TermoProl Refrigeração Industrial',
    appSheet: 'SIM',
    status: 'Pronto',
    deliveryDate: getRelativeDate(1),
    notes: 'Quadro testado em bancada e aprovado pelo controle de qualidade. Aguardando transporte do cliente.',
    createdAt: new Date().toISOString(),
    environments: [
      {
        id: 'env-201',
        name: 'Câmara Fria de Congelados',
        machines: [
          {
            id: 'm-3',
            name: 'Unidade Condensadora 10HP R404A',
            quantity: 1,
            items: [
              { code: 'COMP-03', name: 'Compressor Semi-Hermético 10HP 380V' },
              { code: 'TRANSD-P', name: 'Transdutor de Pressão 0-500 PSI 4-20mA' }
            ]
          }
        ],
        panel: {
          description: 'Quadro Elétrico Autônomo com IHM 7" e Alarme Sonoro',
          items: [
            { code: 'QUADRO-MET', name: 'Quadro Metálico Sobrepor 600x400x250mm IP65' },
            { code: 'DISJ-63', name: 'Disjuntor Caixa Moldada 63A 3P' },
            { code: 'SOFT-15', name: 'Soft-Starter 15CV 380V c/ Bypass' },
            { code: 'IHM-07', name: 'IHM Touch Screen Colorida 7" Ethernet' }
          ]
        },
        accessories: [
          { code: 'SENS-PT100', name: 'Transmissor de Temperatura PT100 4-20mA' }
        ]
      }
    ]
  },
  {
    id: 'ord-1026',
    orderNumber: 'PV-1026',
    customer: 'Supermercados Horizonte Sul',
    appSheet: 'NÃO',
    status: 'Entregue',
    deliveryDate: getRelativeDate(-4),
    notes: 'Instalação finalizada e comissionada. Garantia de 12 meses ativa.',
    createdAt: new Date().toISOString(),
    environments: [
      {
        id: 'env-301',
        name: 'Ilha de Laticínios',
        machines: [
          {
            id: 'm-4',
            name: 'Evaporador de Teto Duplo Fluxo',
            quantity: 2,
            items: [
              { code: 'COMP-02', name: 'Compressor Hermético 3HP R404A 220V' }
            ]
          }
        ],
        panel: {
          description: 'Quadro de Degelo Elétrico',
          items: [
            { code: 'DISJ-25', name: 'Disjuntor Bipolar DIN 25A Curva C' },
            { code: 'CONT-18', name: 'Contator Trifásico 18A 220V (1NA)' }
          ]
        },
        accessories: [
          { code: 'SENS-NTC', name: 'Sensor de Temperatura NTC 10k 1.5m Inox' }
        ]
      }
    ]
  }
];
