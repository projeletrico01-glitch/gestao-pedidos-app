// Comprehensive Termoprol Nomenclature Decoders based on Linha T (Rev-12) & QC (Rev-07)

export interface DecodedSegment {
  positionIndex?: number;
  key: string;
  variableName: string;
  char: string;
  description: string;
  valid: boolean;
  notes?: string;
  category?: 'prefix' | 'regime' | 'equip' | 'comp' | 'electrical' | 'thermal' | 'air' | 'control' | 'other';
}

export interface NomenclatureSummaryHighlights {
  equipmentType?: string;
  operatingTemp?: string;
  voltage?: string;
  refrigerant?: string;
  compressor?: string;
  defrost?: string;
  controller?: string;
  supervisory?: string;
}

export interface NomenclatureResult {
  rawCode: string;
  cleanCode: string;
  type: 'machine' | 'panel' | 'unknown';
  typeName: string;
  standardNorm: string;
  segments: DecodedSegment[];
  summaryText: string;
  highlights: NomenclatureSummaryHighlights;
  detectedOperatingTemp?: string;
  detectedSupervisory?: 'SIM' | 'NÃO';
  detectedDistance?: string;
}

// -------------------------------------------------------------
// LINHA T TERMOPROL ZANOTTI DICTIONARIES (REV-12)
// -------------------------------------------------------------

export const LINHA_T_REG_OPER: Record<string, string> = {
  'A': 'Alta temperatura (de +20°C à +11°C)',
  'M': 'Média temperatura (de +10°C à -10°C)',
  'B': 'Baixa temperatura (de -12°C à -28°C)',
  'P': 'Polivalente (de +10°C à -28°C)',
  'C': 'Cura (de +20°C à +11°C)',
};

export const LINHA_T_PROJETO: Record<string, string> = {
  'T': 'Linha "T" Termoprol Zanotti',
};

export const LINHA_T_TIPO: Record<string, string> = {
  'M': 'Monobloco de PAREDE',
  'R': 'Monobloco de TETO',
  'P': 'Monobloco PLANO',
  'A': 'Monobloco SELFIE',
  'S': 'Unidade Cond. Fluxo Alternativo',
  'U': 'Unidade Cond. Fluxo Horizontal',
  'L': 'Unidade resfriadora de líquido (Chiller)',
};

export const LINHA_T_COMPRESSOR: Record<string, string> = {
  'H': 'Hermético alternativo',
  'S': 'Semi-hermético alternativo',
  'D': 'Semi-hermético Duplo-estágio',
  'P': 'Hermético "Scroll"',
  'V': 'Semi-hermético Parafuso',
  'I': 'Compressor Inverter (Scroll / Rotativo)',
};

export const LINHA_T_CONTROLE_CAPACIDADE: Record<string, string> = {
  '0': 'Sem controle de capacidade',
  '1': 'Um controle de capacidade',
  '2': 'Dois controles de capacidade',
  '3': 'Três controles de capacidade',
  '4': 'Carga-estocagem (controle manual)',
  '5': 'Inversor de frequência',
  '6': 'Scroll Digital',
};

export const LINHA_T_PARTIDA_COMPRESSOR: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'SoftStarter',
  '2': 'Inversor de frequência',
};

export const LINHA_T_TIPO_CONDENSACAO: Record<string, string> = {
  'W': 'Condensação à água',
  'L': 'Baixa temperatura de condensação (Low Condensing - água)',
  'H': 'Condensação à ar por condensador tipo TUBO ALETA com fluxo de ar HORIZONTAL',
  'V': 'Condensação à ar por condensador tipo TUBO ALETA com fluxo de ar VERTICAL',
  'M': 'Condensação à ar por condensador tipo MICROCANAL com fluxo de ar HORIZONTAL',
  'C': 'Condensação à ar por condensador tipo MICROCANAL com fluxo de ar VERTICAL',
};

export const LINHA_T_TENSAO_ELETRICA: Record<string, string> = {
  '1': '220V 1F 60Hz',
  '3': '220V 3F 60Hz',
  '4': '460V 3F 60Hz',
  '5': '220V 1F 50Hz',
  '6': '220V 3F 50Hz',
  '7': '500V 3F 50Hz / 575V 3F 60Hz',
  '8': '380V 3F 50Hz',
  '9': '380V 3F 60Hz',
};

export const LINHA_T_FLUIDO_REFRIGERANTE: Record<string, string> = {
  'A': 'R134A',
  'F': 'R404A',
  'B': 'R507A',
  'R': 'R22',
  'P': 'R410A',
  'I': 'R454C',
  'L': 'R455A',
  'Q': 'R407C',
  'H': 'R402B',
  'K': 'R449A',
  'Y': 'R1234yf',
};

export const LINHA_T_SISTEMA_AQUECIMENTO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Ciclo reverso automático',
  '2': 'Bateria de resistência',
  '3': 'Resistência de núcleo (degelo)',
};

export const LINHA_T_TIPO_DEGELO: Record<string, string> = {
  'N': 'Natural com válvula termostática',
  'G': 'Gás quente válvula reversora com válvula termostática',
  'E': 'Elétrico com válvula termostática',
  'T': 'Gás quente terceiro tubo com válvula termostática',
  'Y': 'Degelo natural com válvula eletrônica',
  'X': 'Gás quente válvula eletrônica',
  'J': 'Elétrico com válvula eletrônica',
  'K': 'Terceiro tubo com válvula eletrônica',
};

export const LINHA_T_TIPO_FIXACAO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Pés de borracha na base',
  '2': 'Pés de metal na base',
  '3': 'Fixação em parede (travessas)',
  '4': 'Fixação no teto (cabos de aço)',
  '5': 'Fixação no teto (barra roscada)',
  '6': 'Fixação no teto (mão-francesa)',
};

export const LINHA_T_VENTILADOR_EVAPORADOR: Record<string, string> = {
  'P': 'Padrão de fábrica',
  'Z': 'Alta vazão',
  'S': 'Média vazão',
  'E': 'Eletrônico (EC) sem controle automático de ventilação',
  'T': 'Eletrônico (EC) com controle automático de ventilação',
  'F': 'Máxima flecha de ar',
  'C': 'Centrífugo',
};

export const LINHA_T_DESUMIDIFICACAO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Redução de vazão',
  '2': 'Redução de vazão + Booster',
  '3': 'Bateria de resistência',
  '4': 'Serpentina duplo circuito',
  '5': 'Serpentina duplo circuito + Bateria de resistências',
  '6': 'Serpentina duplo circuito + Redução de vazão',
  '7': 'Desumidificador independente',
};

export const LINHA_T_VENTILADOR_CONDENSADOR: Record<string, string> = {
  'P': 'Padrão de fábrica',
  'Z': 'Alta vazão',
  'S': 'Média vazão',
  'E': 'Eletrônico (EC) sem controle automático de ventilação',
  'T': 'Eletrônico (EC) com controle automático de ventilação',
  'F': 'Máxima flecha de ar',
  'C': 'Centrífugo',
};

export const LINHA_T_CONTROLE_EQUIPAMENTO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Local (no equipamento) FullGauge',
  '2': 'Local (no equipamento) Eliwell',
  '3': 'Remoto FullGauge',
  '4': 'Remoto Eliwell',
  '5': 'Local (no equipamento) Dixell',
  '6': 'Remoto Dixell',
  '7': 'Local (no equipamento) Dixell (maturação de bananas)',
  '8': 'Local (no equipamento) Carel',
  '9': 'Remoto Carel',
};

export const LINHA_T_UMIDIFICACAO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Aspersor centrífugo',
  '2': 'Aspersor ar comprimido (bico duplo)',
  '3': 'Aspersor bomba de alta pressão',
  '4': 'Aspersor ar comprimido (simples)',
  '5': 'Umidificador ultrassônico',
};

export const LINHA_T_CONTROLE_MASTER: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Quadro Master por ambiente',
  '2': 'Quadro Master conjugado (Master de todos os ambientes)',
};

export const LINHA_T_SISTEMA_SUPERVISORIO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Sitrad (FullGauge)',
  '2': 'TelevisGo (Eliwell)',
  '3': 'X-Web (Dixell)',
  '4': 'Boss (Carel)',
};

export const LINHA_T_RENOVACAO_AR: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Damper Padrão',
  '2': 'Damper com Temporizador',
};

export const LINHA_T_BOOSTER: Record<string, string> = {
  'N': 'Não se aplica',
  'B': 'Contém ventilador(es) booster',
};

export const LINHA_T_DEGELO_BANDEJA: Record<string, string> = {
  'P': 'Degelo padrão (resistência elétrica se TEMP < 0°C)',
  'G': 'Degelo por circuito de gás quente',
};

// -------------------------------------------------------------
// QUADRO DE COMANDO / FORÇA DICTIONARIES (REV-07)
// -------------------------------------------------------------

export const QC_TIPO: Record<string, string> = {
  'QC': 'Quadro de Comando',
  'QF': 'Quadro de Força',
};

export const QC_ALARME_SONORO: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Contém alarme sonoro',
};

export const QC_AVISO_PORTA: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Contém aviso de porta',
};

export const QC_CONTROLE_SAZONAL: Record<string, string> = {
  '0': 'Não se aplica',
  '1': 'Com controle sazonal',
};

// -------------------------------------------------------------
// INTERNAL PARSER FOR LINHA T BODY
// -------------------------------------------------------------

function parseLinhaTBody(code: string, startIndex: number = 0, initialSegments: DecodedSegment[] = []): DecodedSegment[] {
  const segments: DecodedSegment[] = [...initialSegments];
  let index = startIndex;
  let pos = segments.length + 1;

  // 1. Regime de operação (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_REG_OPER[char] || `Regime (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'REG_OPER',
      variableName: 'Regime de Operação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_REG_OPER[char]),
      category: 'regime'
    });
    index += 1;
  }

  // 2. Projeto (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = char === 'T' ? 'Linha "T" Termoprol Zanotti' : (LINHA_T_PROJETO[char] || `Projeto (${char})`);
    segments.push({
      positionIndex: pos++,
      key: 'PROJETO',
      variableName: 'Projeto',
      char,
      description: desc,
      valid: char === 'T',
      category: 'equip'
    });
    index += 1;
  }

  // 3. Tipo (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_TIPO[char] || `Tipo (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_003',
      variableName: 'Tipo de Equipamento',
      char,
      description: desc,
      valid: Boolean(LINHA_T_TIPO[char]),
      category: 'equip'
    });
    index += 1;
  }

  // 4. Modelo (digits, e.g. 1100, 1000, 420, etc.)
  if (index < code.length) {
    let modelChars = '';
    // Collect all consecutive digits
    while (index < code.length && /\d/.test(code[index])) {
      modelChars += code[index];
      index++;
    }

    // Fallback if not pure digits
    if (!modelChars && index < code.length) {
      modelChars = code[index];
      index++;
    }

    segments.push({
      positionIndex: pos++,
      key: 'CFG_004',
      variableName: 'Modelo do Equipamento',
      char: modelChars,
      description: `Modelo ${modelChars}`,
      valid: true,
      category: 'equip'
    });
  }

  // 5. Compressor (1 char: H, S, D, P, V, I)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_COMPRESSOR[char] || (char === '0' ? 'Não especificado' : `Compressor (${char})`);
    segments.push({
      positionIndex: pos++,
      key: 'CFG_005',
      variableName: 'Compressor',
      char,
      description: desc,
      valid: Boolean(LINHA_T_COMPRESSOR[char] || char === '0'),
      category: 'comp'
    });
    index++;
  }

  // 6. Controle de capacidade (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_CONTROLE_CAPACIDADE[char] || `Controle de capacidade (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_006',
      variableName: 'Controle de Capacidade',
      char,
      description: desc,
      valid: Boolean(LINHA_T_CONTROLE_CAPACIDADE[char]),
      category: 'comp'
    });
    index++;
  }

  // 7. Partida do Compressor (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_PARTIDA_COMPRESSOR[char] || `Partida (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_001',
      variableName: 'Partida do Compressor',
      char,
      description: desc,
      valid: Boolean(LINHA_T_PARTIDA_COMPRESSOR[char]),
      category: 'electrical'
    });
    index++;
  }

  // 8. Tipo de condensação (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_TIPO_CONDENSACAO[char] || `Condensação (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_007',
      variableName: 'Tipo de Condensação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_TIPO_CONDENSACAO[char]),
      category: 'thermal'
    });
    index++;
  }

  // 9. Tensão elétrica (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_TENSAO_ELETRICA[char] || `Tensão (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_008',
      variableName: 'Tensão Elétrica',
      char,
      description: desc,
      valid: Boolean(LINHA_T_TENSAO_ELETRICA[char]),
      category: 'electrical'
    });
    index++;
  }

  // 10. Fluído refrigerante (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_FLUIDO_REFRIGERANTE[char] || `Fluído refrigerante (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_009',
      variableName: 'Fluído Refrigerante',
      char,
      description: desc,
      valid: Boolean(LINHA_T_FLUIDO_REFRIGERANTE[char]),
      category: 'thermal'
    });
    index++;
  }

  // 11. Sistema de aquecimento (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_SISTEMA_AQUECIMENTO[char] || `Aquecimento (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_010',
      variableName: 'Sistema de Aquecimento',
      char,
      description: desc,
      valid: Boolean(LINHA_T_SISTEMA_AQUECIMENTO[char]),
      category: 'thermal'
    });
    index++;
  }

  // 12. Tipo de degelo (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_TIPO_DEGELO[char] || `Degelo (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_011',
      variableName: 'Tipo de Degelo',
      char,
      description: desc,
      valid: Boolean(LINHA_T_TIPO_DEGELO[char]),
      category: 'thermal'
    });
    index++;
  }

  // 13. Tipo de fixação (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_TIPO_FIXACAO[char] || `Fixação (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_012',
      variableName: 'Tipo de Fixação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_TIPO_FIXACAO[char]),
      category: 'equip'
    });
    index++;
  }

  // 14. Ventilador evaporador (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_VENTILADOR_EVAPORADOR[char] || `Ventilador evaporador (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_013',
      variableName: 'Ventilador Evaporador',
      char,
      description: desc,
      valid: Boolean(LINHA_T_VENTILADOR_EVAPORADOR[char]),
      category: 'air'
    });
    index++;
  }

  // 15. Sistema de desumidificação (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_DESUMIDIFICACAO[char] || `Desumidificação (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_014',
      variableName: 'Sistema de Desumidificação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_DESUMIDIFICACAO[char]),
      category: 'air'
    });
    index++;
  }

  // 16. Ventilador condensador (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_VENTILADOR_CONDENSADOR[char] || `Ventilador condensador (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_015',
      variableName: 'Ventilador Condensador',
      char,
      description: desc,
      valid: Boolean(LINHA_T_VENTILADOR_CONDENSADOR[char]),
      category: 'air'
    });
    index++;
  }

  // 17. Controle do equipamento (1 char)
  if (index < code.length) {
    const char = code[index];
    const desc = LINHA_T_CONTROLE_EQUIPAMENTO[char] || `Controle (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_016',
      variableName: 'Controle do Equipamento',
      char,
      description: desc,
      valid: Boolean(LINHA_T_CONTROLE_EQUIPAMENTO[char]),
      category: 'control'
    });
    index++;
  }

  // If there are more characters, check for extended Rev-12 positions
  if (index < code.length) {
    // 18. Pescoço (mm)
    let pescoVal = '';
    while (index < code.length && /\d/.test(code[index])) {
      pescoVal += code[index];
      index++;
      if (pescoVal.length >= 3) break;
    }
    if (!pescoVal && index < code.length) {
      pescoVal = code[index];
      index++;
    }
    segments.push({
      positionIndex: pos++,
      key: 'CFG_017',
      variableName: 'Pescoço (Espessura painel)',
      char: pescoVal,
      description: `${pescoVal} mm`,
      valid: true,
      category: 'equip'
    });
  }

  if (index < code.length) {
    // 19. Sistema de umidificação
    const char = code[index];
    const desc = LINHA_T_UMIDIFICACAO[char] || `Umidificação (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_018',
      variableName: 'Sistema de Umidificação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_UMIDIFICACAO[char]),
      category: 'air'
    });
    index++;
  }

  if (index < code.length) {
    // 20. Controle Master
    const char = code[index];
    const desc = LINHA_T_CONTROLE_MASTER[char] || `Controle Master (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_019',
      variableName: 'Controle Master',
      char,
      description: desc,
      valid: Boolean(LINHA_T_CONTROLE_MASTER[char]),
      category: 'control'
    });
    index++;
  }

  if (index < code.length) {
    // 21. Sistema supervisório
    const char = code[index];
    const desc = LINHA_T_SISTEMA_SUPERVISORIO[char] || `Supervisório (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_020',
      variableName: 'Sistema Supervisório',
      char,
      description: desc,
      valid: Boolean(LINHA_T_SISTEMA_SUPERVISORIO[char]),
      category: 'control'
    });
    index++;
  }

  if (index < code.length) {
    // 22. Comp. linha de cobre (m)
    const char = code[index];
    segments.push({
      positionIndex: pos++,
      key: 'CFG_021',
      variableName: 'Comp. Linha de Cobre',
      char,
      description: char === '0' ? 'Não se aplica' : `${char} metro(s)`,
      valid: true,
      category: 'other'
    });
    index++;
  }

  if (index < code.length) {
    // 23. Temp de operação (°C)
    const char = code[index];
    segments.push({
      positionIndex: pos++,
      key: 'TEMP',
      variableName: 'Temperatura de Operação',
      char,
      description: char === '0' ? 'Padrão' : `${char}°C`,
      valid: true,
      category: 'regime'
    });
    index++;
  }

  if (index < code.length) {
    // 24. Renovação de ar
    const char = code[index];
    const desc = LINHA_T_RENOVACAO_AR[char] || `Renovação de ar (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_022',
      variableName: 'Renovação de Ar',
      char,
      description: desc,
      valid: Boolean(LINHA_T_RENOVACAO_AR[char]),
      category: 'air'
    });
    index++;
  }

  if (index < code.length) {
    // 25. Ventilador booster
    const char = code[index];
    const desc = LINHA_T_BOOSTER[char] || `Booster (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_038',
      variableName: 'Ventilador Booster',
      char,
      description: desc,
      valid: Boolean(LINHA_T_BOOSTER[char]),
      category: 'air'
    });
    index++;
  }

  if (index < code.length) {
    // 26. Degelo na bandeja
    const char = code[index];
    const desc = LINHA_T_DEGELO_BANDEJA[char] || `Degelo bandeja (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_117',
      variableName: 'Degelo na Bandeja',
      char,
      description: desc,
      valid: Boolean(LINHA_T_DEGELO_BANDEJA[char]),
      category: 'thermal'
    });
    index++;
  }

  // Any extra trailing characters
  if (index < code.length) {
    const rest = code.slice(index);
    segments.push({
      positionIndex: pos++,
      key: 'EXTRA',
      variableName: 'Caracteres Adicionais',
      char: rest,
      description: rest,
      valid: true,
      category: 'other'
    });
  }

  return segments;
}

// Helper to extract key summary highlights
function extractHighlights(segments: DecodedSegment[]): NomenclatureSummaryHighlights {
  const highlights: NomenclatureSummaryHighlights = {};

  const typeSeg = segments.find(s => s.key === 'CFG_003');
  const modelSeg = segments.find(s => s.key === 'CFG_004');
  if (typeSeg || modelSeg) {
    highlights.equipmentType = `${typeSeg?.description || ''} ${modelSeg?.description || ''}`.trim();
  }

  const regOperSeg = segments.find(s => s.key === 'REG_OPER');
  if (regOperSeg) {
    if (regOperSeg.char === 'B') highlights.operatingTemp = 'Baixa (-12°C a -28°C)';
    else if (regOperSeg.char === 'M') highlights.operatingTemp = 'Média (+10°C a -10°C)';
    else if (regOperSeg.char === 'A') highlights.operatingTemp = 'Alta (+20°C a +11°C)';
    else if (regOperSeg.char === 'C') highlights.operatingTemp = 'Cura (+20°C a +11°C)';
    else if (regOperSeg.char === 'P') highlights.operatingTemp = 'Polivalente (+10°C a -28°C)';
  }

  const tensaoSeg = segments.find(s => s.key === 'CFG_008');
  if (tensaoSeg) highlights.voltage = tensaoSeg.description;

  const gasSeg = segments.find(s => s.key === 'CFG_009');
  if (gasSeg) highlights.refrigerant = gasSeg.description;

  const compSeg = segments.find(s => s.key === 'CFG_005');
  if (compSeg) highlights.compressor = compSeg.description;

  const degeloSeg = segments.find(s => s.key === 'CFG_011');
  if (degeloSeg) highlights.defrost = degeloSeg.description;

  const ctrlSeg = segments.find(s => s.key === 'CFG_016');
  if (ctrlSeg) highlights.controller = ctrlSeg.description;

  const supSeg = segments.find(s => s.key === 'CFG_020');
  if (supSeg && supSeg.char !== '0') highlights.supervisory = supSeg.description;

  return highlights;
}

// -------------------------------------------------------------
// DECODERS
// -------------------------------------------------------------

/**
 * Decodes a Linha T Machine Nomenclature string
 * Handles clean machine codes (e.g. "MTM420S01H9F0G3P0P1100411000NP")
 * as well as codes with panel prefix (e.g. "QFMTS1000S00W9L0X1P0P5" or "QFBTU1100I00C3B0G1P0P5")
 */
export function decodeMachineNomenclature(rawInput: string): NomenclatureResult {
  const clean = rawInput.trim().toUpperCase().replace(/[\s\-_]/g, '');
  if (!clean) {
    return {
      rawCode: rawInput,
      cleanCode: '',
      type: 'machine',
      typeName: 'Máquina Linha T',
      standardNorm: 'Termoprol Zanotti - Linha T (Rev-12)',
      segments: [],
      summaryText: 'Insira o código da máquina para decodificar.',
      highlights: {},
    };
  }

  const initialSegments: DecodedSegment[] = [];
  let startIndex = 0;

  // Handle prefix if user pasted QF or QC
  if (clean.startsWith('QF')) {
    initialSegments.push({
      positionIndex: 1,
      key: 'TIPO_PAINEL',
      variableName: 'Tipo de Painel',
      char: 'QF',
      description: 'Quadro de Força (Identificador de Força / Montagem)',
      valid: true,
      category: 'prefix'
    });
    startIndex = 2;
  } else if (clean.startsWith('QC')) {
    initialSegments.push({
      positionIndex: 1,
      key: 'TIPO_PAINEL',
      variableName: 'Tipo de Painel',
      char: 'QC',
      description: 'Quadro de Comando (Identificador de Comando / CLP)',
      valid: true,
      category: 'prefix'
    });
    startIndex = 2;
  }

  const segments = parseLinhaTBody(clean, startIndex, initialSegments);
  const highlights = extractHighlights(segments);

  const regOperSeg = segments.find(s => s.key === 'REG_OPER');
  const tempSeg = segments.find(s => s.key === 'TEMP');
  let detectedOperatingTemp: string | undefined = highlights.operatingTemp;
  if (!detectedOperatingTemp && tempSeg && tempSeg.char !== '0') {
    detectedOperatingTemp = `${tempSeg.char}°C`;
  }

  const supSeg = segments.find(s => s.key === 'CFG_020');
  const detectedSupervisory: 'SIM' | 'NÃO' | undefined = supSeg && supSeg.char !== '0' ? 'SIM' : undefined;

  const distSeg = segments.find(s => s.key === 'CFG_021');
  const detectedDistance: string | undefined = distSeg && distSeg.char !== '0' ? `${distSeg.char}m` : undefined;

  return {
    rawCode: rawInput,
    cleanCode: clean,
    type: 'machine',
    typeName: 'Máquina Linha T',
    standardNorm: 'Termoprol Zanotti - Linha T (Rev-12)',
    segments,
    summaryText: segments.map(s => `${s.char}: ${s.description}`).join(' • '),
    highlights,
    detectedOperatingTemp,
    detectedSupervisory,
    detectedDistance,
  };
}

/**
 * Decodes a Quadro de Comando / Força Nomenclature string
 * Handles:
 * 1) Combined Linha T machine specification codes:
 *    e.g. "QFBTU1100I00C3B0G1P0P5" or "QFMTS1000S00W9L0X1P0P5"
 * 2) Standard pure QC table codes (Rev-07):
 *    e.g. "QC04350100P102"
 */
export function decodePanelNomenclature(rawInput: string): NomenclatureResult {
  const clean = rawInput.trim().toUpperCase().replace(/[\s\-_]/g, '');
  if (!clean) {
    return {
      rawCode: rawInput,
      cleanCode: '',
      type: 'panel',
      typeName: 'Quadro de Comando / Força',
      standardNorm: 'Termoprol - QC / QF',
      segments: [],
      summaryText: 'Insira o código do quadro para decodificar.',
      highlights: {},
    };
  }

  let index = 0;
  let panelPrefix = 'QC';
  const segments: DecodedSegment[] = [];

  if (clean.startsWith('QF')) {
    panelPrefix = 'QF';
    segments.push({
      positionIndex: 1,
      key: 'TIPO_PAINEL',
      variableName: 'Tipo de Painel',
      char: 'QF',
      description: 'Quadro de Força',
      valid: true,
      category: 'prefix'
    });
    index = 2;
  } else if (clean.startsWith('QC')) {
    panelPrefix = 'QC';
    segments.push({
      positionIndex: 1,
      key: 'TIPO_PAINEL',
      variableName: 'Tipo de Painel',
      char: 'QC',
      description: 'Quadro de Comando',
      valid: true,
      category: 'prefix'
    });
    index = 2;
  } else {
    segments.push({
      positionIndex: 1,
      key: 'TIPO_PAINEL',
      variableName: 'Tipo de Painel',
      char: 'QC',
      description: 'Quadro de Comando (Inferido)',
      valid: true,
      category: 'prefix'
    });
  }

  const remaining = clean.slice(index);
  // Check if remaining part is a Linha T specification (e.g. BTU1100..., MTS1000..., etc.)
  const isCombinedLinhaT = /^[AMBCP]T[MRPASUL]/.test(remaining);

  if (isCombinedLinhaT) {
    const fullSegments = parseLinhaTBody(clean, index, segments);
    const highlights = extractHighlights(fullSegments);

    const supSeg = fullSegments.find(s => s.key === 'CFG_020');
    const detectedSupervisory: 'SIM' | 'NÃO' | undefined = supSeg && supSeg.char !== '0' ? 'SIM' : undefined;

    return {
      rawCode: rawInput,
      cleanCode: clean,
      type: 'panel',
      typeName: panelPrefix === 'QF' ? 'Quadro de Força (Linha T Integrada)' : 'Quadro de Comando (Linha T Integrada)',
      standardNorm: 'Termoprol - QC/QF c/ Especificação Linha T (Rev-12)',
      segments: fullSegments,
      summaryText: fullSegments.map(s => `${s.char}: ${s.description}`).join(' • '),
      highlights,
      detectedOperatingTemp: highlights.operatingTemp,
      detectedSupervisory,
    };
  }

  // Pure QC Table Layout (Rev-07)
  let pos = 2;

  // 1: Sistema de aquecimento
  if (index < clean.length) {
    const char = clean[index];
    const desc = LINHA_T_SISTEMA_AQUECIMENTO[char] || `Aquecimento (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_010',
      variableName: 'Sistema de Aquecimento',
      char,
      description: desc,
      valid: Boolean(LINHA_T_SISTEMA_AQUECIMENTO[char]),
      category: 'thermal'
    });
    index++;
  }

  // 2: Sistema de Desumidificação
  if (index < clean.length) {
    const char = clean[index];
    const desc = LINHA_T_DESUMIDIFICACAO[char] || `Desumidificação (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_014',
      variableName: 'Sistema de Desumidificação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_DESUMIDIFICACAO[char]),
      category: 'air'
    });
    index++;
  }

  // 3: Controle do equipamento
  if (index < clean.length) {
    const char = clean[index];
    const desc = LINHA_T_CONTROLE_EQUIPAMENTO[char] || `Controle (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_016',
      variableName: 'Controle do Equipamento',
      char,
      description: desc,
      valid: Boolean(LINHA_T_CONTROLE_EQUIPAMENTO[char]),
      category: 'control'
    });
    index++;
  }

  // 4: Sistema de Umidificação
  if (index < clean.length) {
    const char = clean[index];
    const desc = char === '1' ? 'Contém umidificador' : (LINHA_T_UMIDIFICACAO[char] || (char === '0' ? 'Não se aplica' : `Umidificação (${char})`));
    segments.push({
      positionIndex: pos++,
      key: 'CFG_018',
      variableName: 'Sistema de Umidificação',
      char,
      description: desc,
      valid: Boolean(LINHA_T_UMIDIFICACAO[char] || char === '1' || char === '0'),
      category: 'air'
    });
    index++;
  }

  // 5: Controle Master
  if (index < clean.length) {
    const char = clean[index];
    const desc = LINHA_T_CONTROLE_MASTER[char] || `Controle Master (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_019',
      variableName: 'Controle Master',
      char,
      description: desc,
      valid: Boolean(LINHA_T_CONTROLE_MASTER[char]),
      category: 'control'
    });
    index++;
  }

  // 6: Sistema supervisório
  if (index < clean.length) {
    const char = clean[index];
    const desc = LINHA_T_SISTEMA_SUPERVISORIO[char] || `Supervisório (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_020',
      variableName: 'Sistema Supervisório',
      char,
      description: desc,
      valid: Boolean(LINHA_T_SISTEMA_SUPERVISORIO[char]),
      category: 'control'
    });
    index++;
  }

  // 7: Alarme sonoro
  if (index < clean.length) {
    const char = clean[index];
    const desc = QC_ALARME_SONORO[char] || `Alarme sonoro (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'ALARME_S',
      variableName: 'Alarme Sonoro',
      char,
      description: desc,
      valid: Boolean(QC_ALARME_SONORO[char]),
      category: 'other'
    });
    index++;
  }

  // 8: Aviso de porta
  if (index < clean.length) {
    const char = clean[index];
    const desc = QC_AVISO_PORTA[char] || `Aviso de porta (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'AVISO_PORT',
      variableName: 'Aviso de Porta',
      char,
      description: desc,
      valid: Boolean(QC_AVISO_PORTA[char]),
      category: 'other'
    });
    index++;
  }

  // 9: Ventilador evaporador
  if (index < clean.length) {
    const char = clean[index];
    let desc = LINHA_T_VENTILADOR_EVAPORADOR[char];
    if (char === '0') desc = 'Não se aplica';
    else if (char === '1') desc = 'Eletrônico (EC) com controle automático de ventilação (T)';
    else if (!desc) desc = `Ventilador evaporador (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_013',
      variableName: 'Ventilador Evaporador',
      char,
      description: desc,
      valid: true,
      category: 'air'
    });
    index++;
  }

  // 10: Renovação de ar
  if (index < clean.length) {
    const char = clean[index];
    const desc = LINHA_T_RENOVACAO_AR[char] || `Renovação de ar (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'CFG_022',
      variableName: 'Renovação de Ar',
      char,
      description: desc,
      valid: Boolean(LINHA_T_RENOVACAO_AR[char]),
      category: 'air'
    });
    index++;
  }

  // 11: Controle sazonal
  if (index < clean.length) {
    const char = clean[index];
    const desc = QC_CONTROLE_SAZONAL[char] || `Controle sazonal (${char})`;
    segments.push({
      positionIndex: pos++,
      key: 'TIMER',
      variableName: 'Controle Sazonal',
      char,
      description: desc,
      valid: Boolean(QC_CONTROLE_SAZONAL[char]),
      category: 'control'
    });
    index++;
  }

  // 12: Quantidade de máquinas
  if (index < clean.length) {
    const char = clean.slice(index);
    segments.push({
      positionIndex: pos++,
      key: 'QTD',
      variableName: 'Qtd de Máquinas Controladas',
      char,
      description: `${char} máquina(s) controlada(s) por este quadro`,
      valid: true,
      category: 'other'
    });
  }

  const supSeg = segments.find(s => s.key === 'CFG_020');
  const detectedSupervisory: 'SIM' | 'NÃO' | undefined = supSeg && supSeg.char !== '0' ? 'SIM' : undefined;

  const ctrlSeg = segments.find(s => s.key === 'CFG_016');

  return {
    rawCode: rawInput,
    cleanCode: clean,
    type: 'panel',
    typeName: panelPrefix === 'QF' ? 'Quadro de Força' : 'Quadro de Comando',
    standardNorm: 'Termoprol Zanotti - Quadro de Comando (Rev-07)',
    segments,
    summaryText: segments.map(s => `${s.char}: ${s.description}`).join(' • '),
    highlights: {
      controller: ctrlSeg?.description,
      supervisory: supSeg?.description,
    },
    detectedSupervisory,
  };
}

/**
 * Universal auto decoder that detects whether input is a Machine code or Panel code
 */
export function decodeNomenclature(rawInput: string, preferType?: 'machine' | 'panel'): NomenclatureResult {
  const clean = rawInput.trim().toUpperCase().replace(/[\s\-_]/g, '');
  if (!clean) {
    return {
      rawCode: rawInput,
      cleanCode: '',
      type: preferType || 'unknown',
      typeName: 'Nomenclatura',
      standardNorm: 'Termoprol Zanotti',
      segments: [],
      summaryText: 'Insira um código para decodificar.',
      highlights: {},
    };
  }

  if (preferType === 'panel') {
    return decodePanelNomenclature(rawInput);
  }

  if (preferType === 'machine') {
    return decodeMachineNomenclature(rawInput);
  }

  if (clean.startsWith('QC') || clean.startsWith('QF')) {
    return decodePanelNomenclature(rawInput);
  }

  return decodeMachineNomenclature(rawInput);
}
