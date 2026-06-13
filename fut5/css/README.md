# Fut5 Germinare ⚽

Jogo de futebol 5 (society) em HTML/CSS/JS puro, com três modos offline
(Partida Rápida, Campeonato e Carreira) e **modo online** (1x1 e campeonato
de carreira por salas com código).

---

## ▶️ Como rodar

### Offline (modos rápido, campeonato e carreira)
Basta **abrir o `index.html`** no navegador (duplo clique). Todo o jogo base
funciona sem internet e sem servidor.

### Online (1x1 e campeonato)
O modo online usa **PeerJS** (peer-to-peer com um broker público gratuito para
a sinalização). Para funcionar de forma confiável, **sirva os arquivos por HTTP**
em vez de abrir via `file://`:

```bash
# dentro da pasta do projeto:
python3 -m http.server 8000
# depois acesse http://localhost:8000 no navegador
```

Para jogar com outra pessoa pela internet, **hospede a pasta** (ex.: GitHub
Pages, Netlify, Vercel) e compartilhe o link. Cada jogador abre o mesmo site,
um cria a sala (recebe um **código**) e os outros entram com esse código.

> ⚠️ **Importante:** o modo online não pôde ser testado ao vivo no ambiente de
> desenvolvimento (sem rede). O código foi escrito e validado estaticamente,
> mas recomenda-se um teste real entre dois dispositivos. Para produção séria,
> vale **hospedar seu próprio PeerServer** (veja peerjs.com) em vez do broker
> público, que tem limites de uso.

---

## 📁 Estrutura

```
fut5/
├── index.html              # estrutura das telas + carrega css/js na ordem
├── assets/                 # imagens (taça/escudo) extraídas
│   ├── trophy.webp
│   └── badge.webp
├── css/
│   ├── base.css            # variáveis, tema, reset
│   ├── screens.css         # sistema de telas
│   ├── splash.css          # menu inicial
│   ├── draft.css           # convocação
│   ├── formation.css       # escalação
│   ├── match.css           # partida
│   ├── result.css          # resultado + tema escuro + hub
│   └── feedback.css        # feedback/carregamento
└── js/
    ├── core/               # núcleo
    │   ├── mode.js         # gameMode
    │   ├── state.js        # estado global da partida
    │   ├── rarity.js       # sistema de raridade / sorteios
    │   ├── helpers.js      # utilidades (clamp, shuffle, showScreen, ...)
    │   └── dispatch.js     # confirmação de escalação
    ├── data/
    │   ├── players.js      # banco de jogadores
    │   └── schemes.js      # posições e esquemas táticos
    ├── match/
    │   ├── chemistry.js    # química, buffs e nota dos jogadores
    │   ├── engine.js       # motor da partida (geração de eventos)
    │   ├── speed.js        # playback + controle de velocidade + renderer
    │   └── result.js       # tela de resultado
    ├── modes/
    │   ├── quick/          # Partida Rápida (draft, lógica, escalação)
    │   ├── cup.js          # Campeonato (mata-mata) + tema + hub
    │   └── career/         # Carreira (config, lógica, elenco, pré-jogo)
    └── online/             # MULTIPLAYER
        ├── net.js          # transporte PeerJS (salas, broadcast, eventos)
        ├── protocol.js     # tipos de mensagem + estado online
        ├── sim.js          # gera e reproduz o relatório da partida
        ├── lobby.js        # menu, criar/entrar, lista de jogadores
        ├── online1v1.js    # fluxo 1x1
        └── onlineCareer.js # campeonato online (pontos corridos)
```

### Por que vários `<script>` clássicos (e não módulos ES)?
Para que o jogo **rode com duplo clique** (`file://`), onde navegadores
bloqueiam `import` de módulos. Os arquivos compartilham um escopo global e são
carregados **em ordem** no `index.html`. É uma divisão limpa por domínio,
fácil de navegar e estender, sem exigir build.

---

## 🌐 Como o online funciona

- **Host = autoridade.** Quem cria a sala simula as partidas e envia a cada
  jogador o "relatório" da sua partida (lista de eventos + placar + pênaltis),
  que é reproduzido localmente com o mesmo renderer do modo offline.
- **1x1:** host e convidado entram com um time aleatório; o host simula e ambos
  assistem ao mesmo jogo (cada um na sua perspectiva).
- **Campeonato (carreira):** vários jogadores entram com o time da carreira.
  O host monta um **pontos corridos** (turno único, método do círculo),
  completando com times **CPU** para fechar a tabela, simula rodada a rodada,
  envia a cada um a sua partida e sincroniza a **classificação**.

---

## ✅ Correções e novidades desta versão

- **Pênaltis:** terminam no instante em que o resultado fica matematicamente
  decidido (sem continuar à toa).
- **Tema escuro:** cores de fonte corrigidas para boa legibilidade.
- **Carreira / Centro de Treinamento:** titulares separados das reservas.
- **Carreira / Gerenciar Time:** mostra o **POT**, ordena por **OVR** e mantém
  só **3 reservas** no elenco (o restante fica "fora do elenco").
- **Escalação:** jogadores disponíveis ordenados por **OVR**.
- **Resumo no fim da partida da carreira** (notas e estatísticas por jogador).
- **Velocidade de simulação** ajustável (1x / 2x / 4x).
- **Modo online** (1x1 e campeonato de carreira por salas com código).
- **Código reorganizado** em arquivos e pastas por domínio.
```
