import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  Fan, 
  Check, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  Sliders,
  CheckCircle2,
  Search,
  Zap,
  Thermometer,
  Wind,
  Layers,
  ArrowRight,
  ShieldCheck,
  Tag,
  Hash
} from 'lucide-react';
import { 
  decodeMachineNomenclature, 
  decodePanelNomenclature, 
  NomenclatureResult,
  DecodedSegment
} from '../utils/nomenclature';

interface NomenclatureDecoderProps {
  initialMachineCode?: string;
  initialPanelCode?: string;
  onApplyMachineCode?: (code: string, decoded: NomenclatureResult) => void;
  onApplyPanelCode?: (code: string, decoded: NomenclatureResult) => void;
  compact?: boolean;
  hideHeader?: boolean;
}

export const NomenclatureDecoder: React.FC<NomenclatureDecoderProps> = ({
  initialMachineCode = '',
  initialPanelCode = '',
  onApplyMachineCode,
  onApplyPanelCode,
  compact = false,
  hideHeader = false
}) => {
  const [activeTab, setActiveTab] = useState<'machine' | 'panel'>('panel');
  
  const [machineCode, setMachineCode] = useState(initialMachineCode || 'MTM420S01H9F0G3P0P1100411000NP');
  const [panelCode, setPanelCode] = useState(initialPanelCode || 'QFBTU1100I00C3B0G1P0P5');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegmentKey, setSelectedSegmentKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync if initial values change
  useEffect(() => {
    if (initialMachineCode) setMachineCode(initialMachineCode);
  }, [initialMachineCode]);

  useEffect(() => {
    if (initialPanelCode) setPanelCode(initialPanelCode);
  }, [initialPanelCode]);

  const machineDecoded = useMemo(() => decodeMachineNomenclature(machineCode), [machineCode]);
  const panelDecoded = useMemo(() => decodePanelNomenclature(panelCode), [panelCode]);

  const currentDecoded = activeTab === 'machine' ? machineDecoded : panelDecoded;
  const currentCode = activeTab === 'machine' ? machineCode : panelCode;

  // Filtered segments based on search
  const filteredSegments = useMemo(() => {
    if (!searchTerm.trim()) return currentDecoded.segments;
    const term = searchTerm.toLowerCase();
    return currentDecoded.segments.filter(s => 
      s.char.toLowerCase().includes(term) ||
      s.variableName.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    );
  }, [currentDecoded.segments, searchTerm]);

  const handleCopySummary = () => {
    if (!currentDecoded.segments.length) return;
    const text = currentDecoded.segments
      .map(s => `• [${s.char}] ${s.variableName}: ${s.description}`)
      .join('\n');
    const header = `TERMEPROL - ${currentDecoded.typeName.toUpperCase()}\nCódigo: ${currentDecoded.cleanCode}\nNorma: ${currentDecoded.standardNorm}\n\n`;
    navigator.clipboard.writeText(header + text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (activeTab === 'machine' && onApplyMachineCode) {
      onApplyMachineCode(machineCode.trim().toUpperCase(), machineDecoded);
    } else if (activeTab === 'panel' && onApplyPanelCode) {
      onApplyPanelCode(panelCode.trim().toUpperCase(), panelDecoded);
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'prefix':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'regime':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
      case 'equip':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'comp':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      case 'electrical':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'thermal':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'air':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800';
      case 'control':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 ${hideHeader ? '' : 'border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm'} overflow-hidden transition-all`}>
      
      {/* 1. Header Bar (when not embedded in modal) */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-5 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Consulta & Decodificador de Nomenclatura Termoprol</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  Rev-12 & Rev-07
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Consulte o significado técnico oficial de cada sigla de máquinas Linha T e quadros de força/comando
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Clean Navigation Switcher Tabs */}
      <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="inline-flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('panel');
                setSelectedSegmentKey(null);
                setSearchTerm('');
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold ${
                activeTab === 'panel'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Quadro de Comando & Força (QC / QF)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('machine');
                setSelectedSegmentKey(null);
                setSearchTerm('');
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold ${
                activeTab === 'machine'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Fan className="w-4 h-4" />
              <span>Modelo da Máquina (Linha T)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Norma: <strong>{currentDecoded.standardNorm}</strong></span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        
        {/* 3. Input Section with Clear & Quick Example Presets */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              {activeTab === 'panel' ? (
                <>
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <span>Código do Quadro de Comando / Força:</span>
                </>
              ) : (
                <>
                  <Fan className="w-4 h-4 text-blue-500" />
                  <span>Código da Nomenclatura da Máquina (Linha T):</span>
                </>
              )}
            </label>

            {/* Quick Presets for Instant Testing */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 font-medium">Exemplos rápidos:</span>
              {activeTab === 'panel' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setPanelCode('QFBTU1100I00C3B0G1P0P5');
                      setSelectedSegmentKey(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-mono font-bold transition flex items-center gap-1 shadow-xs"
                    title="Exemplo: QFBTU1100 (Quadro de Força c/ Linha T)"
                  >
                    <span>QFBTU1100...</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans font-normal">(Exemplo Força)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPanelCode('QFMTS1000S00W9L0X1P0P5');
                      setSelectedSegmentKey(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-mono font-bold transition flex items-center gap-1 shadow-xs"
                    title="Exemplo: QFMTS1000 (Quadro de Força Média Temp)"
                  >
                    <span>QFMTS1000...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPanelCode('QC04350100P102');
                      setSelectedSegmentKey(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono font-bold transition flex items-center gap-1 shadow-xs"
                    title="Exemplo: QC0435... (Quadro de Comando Padrão)"
                  >
                    <span>QC0435...</span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal">(QC Rev-07)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMachineCode('MTM420S01H9F0G3P0P1100411000NP');
                      setSelectedSegmentKey(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:hover:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-mono font-bold transition flex items-center gap-1 shadow-xs"
                    title="Exemplo: MTM420 (Monobloco Parede Completo)"
                  >
                    <span>MTM420...</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-sans font-normal">(Monobloco)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMachineCode('BTU1100I00C3B0G1P0P5');
                      setSelectedSegmentKey(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:hover:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-mono font-bold transition flex items-center gap-1 shadow-xs"
                    title="Exemplo: BTU1100 (Baixa Temp Horizontal)"
                  >
                    <span>BTU1100...</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-sans font-normal">(Baixa Temp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMachineCode('QFMTS1000S00W9L0X1P0P5');
                      setSelectedSegmentKey(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:hover:bg-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700 font-mono font-bold transition flex items-center gap-1 shadow-xs"
                    title="Exemplo: QFMTS1000 (c/ Prefixo QF)"
                  >
                    <span>QFMTS1000...</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              value={activeTab === 'panel' ? panelCode : machineCode}
              onChange={e => {
                const val = e.target.value.toUpperCase().replace(/\s/g, '');
                if (activeTab === 'panel') setPanelCode(val);
                else setMachineCode(val);
                setSelectedSegmentKey(null);
              }}
              placeholder={
                activeTab === 'panel'
                  ? 'Ex: QFBTU1100I00C3B0G1P0P5 ou QC04350100P102'
                  : 'Ex: MTM420S01H9F0G3P0P1100411000NP ou BTU1100I00C3B0G1P0P5'
              }
              className="w-full font-mono text-sm sm:text-base font-black tracking-wider py-3 px-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 transition shadow-inner pr-28"
            />

            <div className="absolute right-2.5 flex items-center gap-1.5">
              {(activeTab === 'panel' ? panelCode : machineCode) && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'panel') setPanelCode('');
                    else setMachineCode('');
                    setSelectedSegmentKey(null);
                  }}
                  className="px-2 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Limpar código"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Real-time Highlights Summary Cards */}
        {currentDecoded.segments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {currentDecoded.highlights.operatingTemp && (
              <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 p-3 rounded-xl flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 flex-shrink-0">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-cyan-800 dark:text-cyan-400 block tracking-wide">
                    Regime / Temp
                  </span>
                  <span className="text-xs font-extrabold text-cyan-950 dark:text-cyan-200 truncate block">
                    {currentDecoded.highlights.operatingTemp}
                  </span>
                </div>
              </div>
            )}

            {currentDecoded.highlights.voltage && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex-shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block tracking-wide">
                    Tensão Elétrica
                  </span>
                  <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 truncate block">
                    {currentDecoded.highlights.voltage}
                  </span>
                </div>
              </div>
            )}

            {currentDecoded.highlights.refrigerant && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                  <Wind className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block tracking-wide">
                    Fluido Refrigerante
                  </span>
                  <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 truncate block">
                    {currentDecoded.highlights.refrigerant}
                  </span>
                </div>
              </div>
            )}

            {currentDecoded.highlights.compressor && (
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 p-3 rounded-xl flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-indigo-800 dark:text-indigo-400 block tracking-wide">
                    Compressor
                  </span>
                  <span className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 truncate block">
                    {currentDecoded.highlights.compressor}
                  </span>
                </div>
              </div>
            )}

            {currentDecoded.highlights.controller && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3 rounded-xl flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-400 block tracking-wide">
                    Controle Eletrônico
                  </span>
                  <span className="text-xs font-extrabold text-rose-950 dark:text-rose-200 truncate block">
                    {currentDecoded.highlights.controller}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Interactive Sigla Strip (Barra Sequencial de Siglas) */}
        {currentDecoded.segments.length > 0 && (
          <div className="bg-slate-100/90 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                <span>Sequência de Siglas ({currentDecoded.segments.length} parâmetros decodificados):</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Clique em qualquer sigla para focar na tabela
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentDecoded.segments.map((seg, idx) => {
                const isSelected = selectedSegmentKey === seg.key;
                return (
                  <button
                    key={`${seg.key}-${idx}`}
                    type="button"
                    onClick={() => setSelectedSegmentKey(isSelected ? null : seg.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 ring-2 ring-blue-300'
                        : `${getCategoryBadge(seg.category)} hover:scale-102`
                    }`}
                    title={`${seg.variableName}: ${seg.description}`}
                  >
                    <span className="font-black text-xs">{seg.char}</span>
                    <span className="text-[10px] font-sans font-medium opacity-85 hidden md:inline truncate max-w-[120px]">
                      {seg.variableName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Clean, Structured Decoded Table View */}
        {currentDecoded.segments.length > 0 ? (
          <div className="space-y-3">
            {/* Table Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-grow max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por sigla, nome ou descrição..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5 shadow-xs"
                  title="Copiar resumo decodificado para a área de transferência"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
                </button>

                {(onApplyMachineCode || onApplyPanelCode) && (
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aplicar ao Ambiente</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[460px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 w-24">Sigla</th>
                      <th className="py-2.5 px-3 w-48 sm:w-56">Parâmetro / Variável</th>
                      <th className="py-2.5 px-4">Significado Oficial Termoprol</th>
                      <th className="py-2.5 px-3 w-28 text-right">Referência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                    {filteredSegments.map((seg, idx) => {
                      const isHighlighted = selectedSegmentKey === seg.key;
                      return (
                        <tr 
                          key={`${seg.key}-${idx}`}
                          onClick={() => setSelectedSegmentKey(isHighlighted ? null : seg.key)}
                          className={`transition cursor-pointer ${
                            isHighlighted 
                              ? 'bg-blue-50/90 dark:bg-blue-950/50 font-medium' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {seg.positionIndex || idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 font-mono font-black text-xs rounded-md border shadow-2xs ${getCategoryBadge(seg.category)}`}>
                              {seg.char}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                            {seg.variableName}
                          </td>
                          <td className="py-2 px-4 text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                            {seg.description}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {seg.key}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhum código preenchido
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Cole ou digite o código de uma máquina ou quadro de comando acima (ou clique em um dos exemplos rápidos) para decodificar todas as siglas automaticamente.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
