// ===================== POSIÇÕES & ESQUEMAS =====================
const POS_INFO = {
  gk:  { label: 'GOLEIRO',  icon: '🧤', cls: 'gk'  },
  zag: { label: 'ZAGUEIRO', icon: '🛡️', cls: 'zag' },
  ata: { label: 'ATACANTE', icon: '⚡', cls: 'ata' },
};

// Sempre 5 jogadores: 1 no gol + 4 na linha. O esquema muda só a linha.
const GK_SLOT = { key:'gk', roles:['gk'], label:'GK', x:50, y:86 };

const SCHEMES = {
  quadrado: { name:'2-2 Clássico', slots:[
    { key:'s1', roles:['zag'], label:'ZAG', x:30, y:60 },
    { key:'s2', roles:['zag'], label:'ZAG', x:70, y:60 },
    { key:'s3', roles:['ata'], label:'ATA', x:30, y:30 },
    { key:'s4', roles:['ata'], label:'ATA', x:70, y:30 },
  ]},
  losango: { name:'1-2-1 Losango', slots:[
    { key:'s1', roles:['zag'],       label:'FIXO', x:50, y:66 },
    { key:'s2', roles:['zag','ata'], label:'ALA',  x:22, y:45 },
    { key:'s3', roles:['zag','ata'], label:'ALA',  x:78, y:45 },
    { key:'s4', roles:['ata'],       label:'PIVÔ', x:50, y:24 },
  ]},
  retranca: { name:'3-1 Retranca', slots:[
    { key:'s1', roles:['zag'], label:'ZAG', x:22, y:60 },
    { key:'s2', roles:['zag'], label:'ZAG', x:50, y:67 },
    { key:'s3', roles:['zag'], label:'ZAG', x:78, y:60 },
    { key:'s4', roles:['ata'], label:'ATA', x:50, y:27 },
  ]},
  ofensiva: { name:'1-3 Ofensiva', slots:[
    { key:'s1', roles:['zag'], label:'ZAG', x:50, y:64 },
    { key:'s2', roles:['ata'], label:'ATA', x:22, y:33 },
    { key:'s3', roles:['ata'], label:'ATA', x:78, y:33 },
    { key:'s4', roles:['ata'], label:'ATA', x:50, y:21 },
  ]},
};

function currentSlots() {
  return getSlotsForScheme(state.scheme);
}

const FORMATION_KEYS = ['gk', 's1', 's2', 's3', 's4'];

function getSlotsForScheme(schemeKey) {
  const scheme = SCHEMES[schemeKey] || SCHEMES.quadrado;
  return [GK_SLOT, ...scheme.slots];
}
