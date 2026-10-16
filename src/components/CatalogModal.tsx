import React, { useState, useRef } from 'react';
import { 
  BookMarked, 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Trash2, 
  RotateCcw,
  Tag,
  Check,
  AlertCircle
} from 'lucide-react';
import { CatalogItem } from '../types';
import { 
  readCatalogFromExcel, 
  downloadCatalogTemplate, 
  exportCatalogToExcel 
} from '../utils/excel';
import { initialCatalogData } from '../data/initialData';

interface CatalogModalProps {
  isOpen: boolean;
  catalog: CatalogItem[];
  onClose: () => void;
  onUpdateCatalog: (newCatalog: CatalogItem[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  catalog,
  onClose,
  onUpdateCatalog,
  onShowToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Componentes');
  const [unit, setUnit] = useState('UN');
  const [price, setPrice] = useState('');

  const excelInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = Array.from(new Set(['Máquinas', 'Quadros', 'Componentes', 'Acessórios', ...catalog.map(c => c.category || 'Geral')]));

  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) {
      onShowToast('Informe o código e a descrição do item.', 'warning');
      return;
    }

    const existingIdx = catalog.findIndex(c => c.code.toUpperCase() === cleanCode);
    const newItem: CatalogItem = {
      code: cleanCode,
      name: cleanName,
      category: category || 'Geral',
      unit: unit || 'UN',
      price: price ? parseFloat(price) : undefined
    };

    if (existingIdx >= 0) {
      const updated = [...catalog];
      updated[existingIdx] = newItem;
      onUpdateCatalog(updated);
      onShowToast(`Item ${cleanCode} atualizado no catálogo!`, 'success');
    } else {
      onUpdateCatalog([...catalog, newItem]);
      onShowToast(`Item ${cleanCode} adicionado com sucesso!`, 'success');
    }

    setCode('');
    setName('');
    setPrice('');
  };

  const handleRemoveItem = (itemCode: string) => {
    const updated = catalog.filter(c => c.code !== itemCode);
    onUpdateCatalog(updated);
    onShowToast(`Item ${itemCode} removido do catálogo.`, 'info');
  };

  const handleClearCatalog = () => {
    if (window.confirm('Tem certeza de que deseja apagar TODOS os itens do catálogo?')) {
      onUpdateCatalog([]);
      onShowToast('Catálogo limpo com sucesso.', 'info');
    }
  };

  const handleResetDefault = () => {
    if (window.confirm('Restaurar o catálogo técnico padrão de fábrica?')) {
      onUpdateCatalog([...initialCatalogData]);
      onShowToast('Catálogo padrão restaurado com sucesso!', 'success');
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await readCatalogFromExcel(file);
    if (result.error) {
      onShowToast(result.error, 'error');
      e.target.value = '';
      return;
    }

    if (result.items.length === 0) {
      onShowToast('Nenhum item válido encontrado na planilha.', 'warning');
      e.target.value = '';
      return;
    }

    // Merge or update catalog
    const updated = [...catalog];
    let added = 0;
    let updatedCount = 0;

    result.items.forEach(newItem => {
      const idx = updated.findIndex(c => c.code.toUpperCase() === newItem.code.toUpperCase());
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], ...newItem };
        updatedCount++;
      } else {
        updated.push(newItem);
        added++;
      }
    });

    onUpdateCatalog(updated);
    onShowToast(`Importação Excel: ${added} novos itens, ${updatedCount} atualizados!`, 'success');
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/30">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Catálogo de Itens & Códigos</h3>
              <p className="text-xs text-slate-400">Banco de peças para autopreenchimento por código</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Excel Integration Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Importar e Exportar Catálogo com Excel
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Carregue arquivos <strong>.xlsx</strong> ou <strong>.xls</strong> contendo colunas como <code>Código</code>, <code>Nome / Descrição</code>, <code>Categoria</code> e <code>Unidade</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={downloadCatalogTemplate}
                className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Modelo Excel</span>
              </button>

              <button
                type="button"
                onClick={() => exportCatalogToExcel(catalog)}
                className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-300 transition flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Exportar (.xlsx)</span>
              </button>

              <input
                type="file"
                ref={excelInputRef}
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelImport}
              />
              <button
                type="button"
                onClick={() => excelInputRef.current?.click()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Carregar Excel</span>
              </button>
            </div>
          </div>

          {/* Quick Manual Item Add Form */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Cadastrar Novo Item Manualmente</span>
            </h4>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Código (ex: COMP-01)"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold uppercase text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  placeholder="Nome / Descrição da Peça"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Máquinas">Máquinas</option>
                  <option value="Quadros">Quadros</option>
                  <option value="Componentes">Componentes</option>
                  <option value="Acessórios">Acessórios</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <input
                  type="text"
                  placeholder="Unidade"
                  value={unit}
                  onChange={e => setUnit(e.target.value.toUpperCase())}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs text-center uppercase bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center justify-center gap-1 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>

          {/* Catalog Items Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Itens Cadastrados no Banco
                </h4>
                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  {filteredCatalog.length} de {catalog.length}
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar código, nome..."
                    className="border border-slate-300 rounded-lg pl-8 pr-3 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-44"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="ALL">Todas Categorias</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-32">Código</th>
                    <th className="p-2.5">Descrição / Nome do Item</th>
                    <th className="p-2.5 w-28">Categoria</th>
                    <th className="p-2.5 text-center w-16">Unidade</th>
                    <th className="p-2.5 text-right w-16">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Nenhum item localizado com os filtros informados.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map(item => (
                      <tr key={item.code} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-bold text-blue-600">
                          {item.code}
                        </td>
                        <td className="p-2.5 text-slate-800 font-medium">
                          {item.name}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200">
                            {item.category || 'Geral'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                          {item.unit || 'UN'}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.code)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Excluir do catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClearCatalog}
              className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Catálogo</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-slate-600 hover:text-slate-900 hover:underline font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
