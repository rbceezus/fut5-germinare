// ===================== ONLINE TRANSPORT (PeerJS) =====================
// Camada de rede peer-to-peer. O "host" cria uma sala (peer id = código) e os
// demais jogadores conectam usando o código. O host atua como autoridade:
// agrega jogadores, simula partidas e transmite resultados.
//
// Requer internet + o broker público do PeerJS para a sinalização.
// (Não funciona via file:// de forma confiável — sirva os arquivos por HTTP.)
//
// API:
//   Net.host(code?) -> Promise<code>
//   Net.join(code)  -> Promise<void>
//   Net.broadcast(msg)         (host -> todos)
//   Net.send(connId, msg)
//   Net.on(type, fn)           registra handler para msg.t === type
//   Net.on('_open'|'_join'|'_leave'|'_error'|'_close', fn)
//   Net.isHost, Net.code, Net.peers (mapa id->conn)

const Net = (() => {
  let peer = null;
  let conns = {};          // peerId -> DataConnection (host: vários; guest: só o host)
  let hostConn = null;     // guest: conexão com o host
  let isHost = false;
  let code = null;
  const handlers = {};     // type -> [fn]

  const PREFIX = 'fg-';    // namespace no broker para reduzir colisões

  function on(type, fn) {
    (handlers[type] = handlers[type] || []).push(fn);
  }
  function emit(type, ...args) {
    (handlers[type] || []).forEach(fn => { try { fn(...args); } catch (e) { console.error(e); } });
  }

  function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function ensurePeerLib() {
    if (typeof Peer === 'undefined') {
      emit('_error', 'Biblioteca de rede (PeerJS) não carregou. Verifique sua conexão.');
      return false;
    }
    return true;
  }

  function wireConn(conn) {
    conn.on('open', () => {
      conns[conn.peer] = conn;
      emit('_join', conn.peer, conn);
    });
    conn.on('data', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      emit(msg.t, msg, conn);
    });
    conn.on('close', () => {
      delete conns[conn.peer];
      emit('_leave', conn.peer);
    });
    conn.on('error', (err) => emit('_error', String(err)));
  }

  function host(desired) {
    return new Promise((resolve, reject) => {
      if (!ensurePeerLib()) return reject('peerjs');
      isHost = true;
      let attempt = 0;
      const tryOpen = () => {
        code = (desired || randomCode());
        peer = new Peer(PREFIX + code);
        peer.on('open', () => {
          peer.on('connection', (conn) => wireConn(conn));
          emit('_open', code);
          resolve(code);
        });
        peer.on('error', (err) => {
          if (err && err.type === 'unavailable-id' && attempt < 5) {
            attempt++; desired = null;
            try { peer.destroy(); } catch (e) {}
            tryOpen();
          } else {
            emit('_error', err && err.type ? err.type : String(err));
            reject(err);
          }
        });
      };
      tryOpen();
    });
  }

  function join(joinCode) {
    return new Promise((resolve, reject) => {
      if (!ensurePeerLib()) return reject('peerjs');
      isHost = false;
      code = String(joinCode || '').toUpperCase().trim();
      peer = new Peer();
      peer.on('open', () => {
        const conn = peer.connect(PREFIX + code, { reliable: true });
        let opened = false;
        const to = setTimeout(() => {
          if (!opened) { emit('_error', 'Sala não encontrada ou host offline.'); reject('timeout'); }
        }, 12000);
        conn.on('open', () => {
          opened = true; clearTimeout(to);
          hostConn = conn; conns[conn.peer] = conn;
          conn.on('data', (msg) => { if (msg && typeof msg === 'object') emit(msg.t, msg, conn); });
          conn.on('close', () => emit('_close'));
          emit('_open', code);
          resolve();
        });
        conn.on('error', (err) => { clearTimeout(to); emit('_error', String(err)); reject(err); });
      });
      peer.on('error', (err) => {
        emit('_error', err && err.type ? err.type : String(err));
        reject(err);
      });
    });
  }

  function broadcast(msg) {
    Object.values(conns).forEach(c => { try { c.send(msg); } catch (e) {} });
  }
  function toHost(msg) {
    if (hostConn) { try { hostConn.send(msg); } catch (e) {} }
  }
  function send(peerId, msg) {
    const c = conns[peerId];
    if (c) { try { c.send(msg); } catch (e) {} }
  }
  function close() {
    try { Object.values(conns).forEach(c => c.close()); } catch (e) {}
    try { if (peer) peer.destroy(); } catch (e) {}
    conns = {}; hostConn = null; peer = null; code = null; isHost = false;
  }

  return {
    host, join, broadcast, toHost, send, close, on,
    get isHost() { return isHost; },
    get code() { return code; },
    get peers() { return conns; },
    get peerCount() { return Object.keys(conns).length; },
  };
})();
