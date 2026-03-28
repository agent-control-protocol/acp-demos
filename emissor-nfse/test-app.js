// ─── Emissor NFS-e — ACP v2 Protocol Client ─────────────────────────────────
// Professional testpage matching Flutter SDK design.
// Demonstrates: navigation, form filling, toasts, confirm dialogs, chat.

// ─── State ───────────────────────────────────────────────────────────────────
let ws = null;
let sessionId = null;
let currentScreen = 'dashboard';
let currentStatus = 'idle';
let chatOpen = false;
let confirmSeq = null;
let tokenBuffer = '';
let streamingEl = null;

// ─── Screen definitions (manifest) ──────────────────────────────────────────
const screens = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    route: '/dashboard',
    fields: [],
    actions: [],
  },
  tomadores: {
    id: 'tomadores',
    label: 'Tomadores de Serviço',
    route: '/tomadores',
    fields: [
      { id: 'nome', type: 'text', label: 'Nome / Razão Social', required: true },
      { id: 'cpf_cnpj', type: 'masked', label: 'CPF/CNPJ', required: true },
      { id: 'email', type: 'email', label: 'E-mail' },
      { id: 'telefone', type: 'phone', label: 'Telefone' },
      { id: 'cep', type: 'masked', label: 'CEP' },
      { id: 'endereco', type: 'text', label: 'Endereço' },
      { id: 'cidade', type: 'text', label: 'Cidade' },
      { id: 'uf', type: 'select', label: 'UF' },
    ],
    actions: [
      { id: 'save_tomador', label: 'Salvar' },
      { id: 'cancel_tomador', label: 'Cancelar' },
    ],
  },
  nfse: {
    id: 'nfse',
    label: 'Emitir NFS-e',
    route: '/nfse',
    fields: [
      { id: 'tomador', type: 'autocomplete', label: 'Tomador', required: true },
      { id: 'servico', type: 'select', label: 'Código do Serviço', required: true },
      { id: 'valor', type: 'currency', label: 'Valor do Serviço', required: true },
      { id: 'data', type: 'date', label: 'Data de Competência' },
      { id: 'aliquota', type: 'number', label: 'Alíquota ISS (%)' },
      { id: 'descricao', type: 'textarea', label: 'Discriminação do Serviço', required: true },
    ],
    actions: [
      { id: 'emit_nfse', label: 'Emitir NFS-e' },
      { id: 'cancel_nfse', label: 'Cancelar' },
    ],
  },
  ordem: {
    id: 'ordem',
    label: 'Ordem de Serviço',
    route: '/ordem',
    fields: [
      { id: 'numero_os', type: 'text', label: 'Nº da OS', required: true },
      { id: 'cliente_nome', type: 'text', label: 'Cliente', required: true },
      { id: 'cliente_cpf_cnpj', type: 'masked', label: 'CPF/CNPJ do Cliente', required: true },
      { id: 'cliente_telefone', type: 'phone', label: 'Telefone do Cliente' },
      { id: 'cliente_email', type: 'email', label: 'E-mail do Cliente' },
      { id: 'responsavel', type: 'text', label: 'Responsável Técnico', required: true },
      { id: 'tipo_servico', type: 'select', label: 'Tipo de Serviço', required: true },
      { id: 'prioridade', type: 'select', label: 'Prioridade', required: true },
      { id: 'data_abertura', type: 'date', label: 'Data de Abertura', required: true },
      { id: 'data_previsao', type: 'date', label: 'Previsão de Entrega', required: true },
      { id: 'horas_estimadas', type: 'number', label: 'Horas Estimadas' },
      { id: 'valor_hora', type: 'currency', label: 'Valor/Hora (R$)' },
      { id: 'valor_total', type: 'currency', label: 'Valor Total (R$)', required: true },
      { id: 'forma_pagamento', type: 'select', label: 'Forma de Pagamento' },
      { id: 'parcelas', type: 'number', label: 'Parcelas' },
      { id: 'descricao_servico', type: 'textarea', label: 'Descrição do Serviço', required: true },
      { id: 'requisitos', type: 'textarea', label: 'Requisitos Técnicos' },
      { id: 'observacoes', type: 'textarea', label: 'Observações' },
    ],
    actions: [
      { id: 'save_ordem', label: 'Salvar OS' },
      { id: 'approve_ordem', label: 'Aprovar' },
      { id: 'cancel_ordem', label: 'Cancelar' },
    ],
  },
  config: {
    id: 'config',
    label: 'Configurações',
    route: '/config',
    fields: [
      { id: 'razao_social', type: 'text', label: 'Razão Social' },
      { id: 'cnpj', type: 'masked', label: 'CNPJ' },
      { id: 'inscricao', type: 'text', label: 'Inscrição Municipal' },
    ],
    actions: [
      { id: 'save_config', label: 'Salvar' },
    ],
  },
};

const screenTitles = {
  dashboard: 'Dashboard',
  tomadores: 'Tomadores de Serviço',
  nfse: 'Emitir NFS-e',
  ordem: 'Ordem de Serviço',
  config: 'Configurações',
};

const statusLabels = {
  idle: '',
  thinking: 'Pensando...',
  executing: 'Executando...',
};

// ─── DOM refs ────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const fab = $('fab');
const fabIcon = $('fabIcon');
const chatPanel = $('chatPanel');
const chatHeader = $('chatHeader');
const connDot = $('connDot');
const chatStatusLabel = $('chatStatusLabel');
const statusSep = $('statusSep');
const chatMessages = $('chatMessages');
const chatEmpty = $('chatEmpty');
const chatInput = $('chatInput');
const chatSendBtn = $('chatSendBtn');
const statusPill = $('statusPill');
const statusPillLabel = $('statusPillLabel');
const toastContainer = $('toastContainer');
const connectBtn = $('connectBtn');
const topbarTitle = $('topbarTitle');

// ─── Auto-connect on load ────────────────────────────────────────────────────
setTimeout(() => doConnect(), 0);

// ─── Disable send when input is empty ─────────────────────────────────────────
chatInput.addEventListener('input', () => {
  const hasText = chatInput.value.trim().length > 0;
  const connected = ws && ws.readyState === WebSocket.OPEN;
  chatSendBtn.disabled = !hasText || !connected;
});

// ─── Navigation ──────────────────────────────────────────────────────────────
function navigateLocal(screenId) {
  if (!screens[screenId]) return;
  currentScreen = screenId;

  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const screenEl = $('screen-' + screenId);
  if (screenEl) screenEl.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.screen === screenId);
  });

  topbarTitle.textContent = screenTitles[screenId] || screenId;

  // Send state to server
  if (ws && ws.readyState === WebSocket.OPEN) {
    sendState();
  }
}

function sendState() {
  const fields = {};
  document.querySelectorAll(`[data-screen="${currentScreen}"][data-field]`).forEach(el => {
    fields[el.dataset.field] = {
      value: el.value || '',
      valid: el.validity ? el.validity.valid : true,
      dirty: el.value !== (el.defaultValue || ''),
    };
  });
  wsSend({
    type: 'state',
    screen: currentScreen,
    fields,
    canSubmit: true,
  });
}

function handleAction(screen, actionId) {
  showToast(`Ação: ${actionId}`, 'info');
}

// ─── Connection ──────────────────────────────────────────────────────────────
function toggleConnection() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  } else {
    doConnect();
  }
}

function doConnect() {
  const url = $('serverUrl').value;
  if (ws) ws.close();

  ws = new WebSocket(url);

  ws.onopen = () => {
    setConnected(true);
  };

  ws.onmessage = (e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch (err) {
      console.error('[ACP] JSON parse error:', err);
      return;
    }
    handleMessage(msg);
  };

  ws.onerror = () => {
    addSystemMsg('Erro de conexão');
  };

  ws.onclose = () => {
    setConnected(false);
    setStatus('idle');
    addSystemMsg('Desconectado');
    sessionId = null;
  };
}

function wsSend(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function setConnected(connected) {
  connDot.classList.toggle('connected', connected);
  chatInput.disabled = !connected;
  chatSendBtn.disabled = !connected || !chatInput.value.trim();
  connectBtn.textContent = connected ? 'Desconectar' : 'Conectar';
  connectBtn.className = 'btn-connect ' + (connected ? 'connected' : 'disconnected');

  if (connected) {
    fab.className = 'fab';
    chatEmpty.querySelector('span').textContent = 'Diga algo para a Emma';
  } else {
    fab.className = 'fab disconnected';
    chatEmpty.querySelector('span').textContent = 'Conecte-se para conversar';
  }
}

// ─── Protocol handling ───────────────────────────────────────────────────────
function handleMessage(msg) {
  switch (msg.type) {
    case 'config':
      sessionId = msg.sessionId;
      sendManifest();
      break;

    case 'chat':
      if (msg.delta) {
        // Streaming delta — text is in message, delta is a boolean flag
        appendToken(msg.message);
      } else if (streamingEl) {
        // Final message after streaming — update text and flush (don't duplicate)
        if (msg.message) streamingEl.textContent = msg.message;
        flushTokenBuffer();
      } else {
        // Complete message (no prior streaming)
        if (msg.from === 'user') {
          addChatMsg(msg.message, 'user');
        } else {
          addChatMsg(msg.message, 'agent');
        }
      }
      break;

    case 'status':
      setStatus(msg.status);
      break;

    case 'command':
      executeCommand(msg);
      break;

    case 'error':
      addSystemMsg('Erro: ' + (msg.message || JSON.stringify(msg)));
      break;

    default:
      console.log('Unhandled:', msg.type, msg);
  }
}

function sendManifest() {
  wsSend({
    type: 'manifest',
    app: 'emissor-nfse',
    version: '1.0.0',
    persona: { name: 'Emma', role: 'assistente virtual da Emitta' },
    currentScreen,
    screens,
  });
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
  wsSend({ type: 'text', message: text });
  addChatMsg(text, 'user');
  chatInput.value = '';
  chatSendBtn.disabled = true;
}

// ─── Command execution ──────────────────────────────────────────────────────
async function executeCommand(msg) {
  const results = [];
  for (let i = 0; i < msg.actions.length; i++) {
    const a = msg.actions[i];
    try {
      await executeAction(a);
      results.push({ index: i, success: true });
    } catch (err) {
      results.push({ index: i, success: false, error: err.message });
    }
  }

  // Send result with current state
  const fields = {};
  document.querySelectorAll(`[data-screen="${currentScreen}"][data-field]`).forEach(el => {
    fields[el.dataset.field] = {
      value: el.value || '',
      valid: true,
      dirty: el.value !== (el.defaultValue || ''),
    };
  });

  wsSend({
    type: 'result',
    seq: msg.seq,
    results,
    state: { screen: currentScreen, fields, canSubmit: true },
  });
}

async function executeAction(action) {
  switch (action.do) {
    case 'navigate':
      navigateLocal(action.screen);
      await sleep(200);
      break;

    case 'set_field':
      await setField(action.field, action.value);
      break;

    case 'clear':
      clearField(action.field);
      break;

    case 'click':
      clickAction(action.action);
      break;

    case 'show_toast':
      showToast(action.message, action.level || 'info', action.duration);
      break;

    case 'ask_confirm':
      await askConfirm(action);
      break;

    case 'open_modal':
    case 'close_modal':
      showToast(`Modal: ${action.do} "${action.modal || ''}"`, 'info');
      break;

    default:
      console.warn('Unknown action:', action.do);
  }
}

// ─── Field operations ────────────────────────────────────────────────────────
function findField(fieldId) {
  return document.querySelector(`[data-screen="${currentScreen}"][data-field="${fieldId}"]`)
      || document.querySelector(`[data-field="${fieldId}"]`);
}

async function setField(fieldId, value) {
  const el = findField(fieldId);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus();

  // For <select> elements, set directly
  if (el.tagName === 'SELECT') {
    el.value = String(value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  // Typewriter animation as local UX sugar
  el.classList.add('filling');
  el.value = '';
  const text = String(value);
  for (let i = 0; i < text.length; i++) {
    el.value += text[i];
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(40);
  }
  el.classList.remove('filling');
}

function clearField(fieldId) {
  const el = findField(fieldId);
  if (el) {
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function clickAction(actionId) {
  const btn = document.querySelector(`[data-screen="${currentScreen}"][data-action="${actionId}"]`)
           || document.querySelector(`[data-action="${actionId}"]`);
  if (btn) {
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => { btn.style.transform = ''; }, 150);
  }
  showToast(`Ação executada: ${actionId}`, 'success');
}

// ─── Confirm dialog ──────────────────────────────────────────────────────────
function askConfirm(action) {
  return new Promise((resolve) => {
    confirmSeq = action.seq || null;
    $('dialogContent').textContent = action.message || 'Deseja continuar?';
    $('dialogOverlay').classList.add('open');

    window._confirmResolve = resolve;
  });
}

function respondConfirm(confirmed) {
  $('dialogOverlay').classList.remove('open');
  if (confirmSeq !== null) {
    wsSend({ type: 'confirm', seq: confirmSeq, confirmed });
  }
  confirmSeq = null;
  if (window._confirmResolve) {
    window._confirmResolve();
    window._confirmResolve = null;
  }
}

// ─── Toast ───────────────────────────────────────────────────────────────────
const toastIcons = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

function showToast(message, level, duration) {
  level = level || 'info';
  duration = duration || 3000;

  const toast = document.createElement('div');
  toast.className = 'toast ' + level;
  const iconEl = document.createElement('span');
  iconEl.className = 'material-icons-round';
  iconEl.textContent = toastIcons[level] || 'info';
  toast.textContent = '';
  toast.appendChild(iconEl);
  toast.appendChild(document.createTextNode(message));
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ─── Status ──────────────────────────────────────────────────────────────────
function setStatus(status) {
  currentStatus = status;

  // FAB
  fab.className = 'fab';
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    fab.className = 'fab disconnected';
  } else if (status !== 'idle') {
    fab.classList.add(status);
  }

  // FAB icon
  if (status === 'thinking' || status === 'executing') {
    fabIcon.style.display = 'none';
    if (!fab.querySelector('.spinner')) {
      const sp = document.createElement('div');
      sp.className = 'spinner';
      fab.appendChild(sp);
    }
  } else {
    fabIcon.style.display = '';
    const sp = fab.querySelector('.spinner');
    if (sp) sp.remove();
  }

  // Chat header border
  chatHeader.className = 'chat-header';
  if (status !== 'idle') chatHeader.classList.add(status);

  // Chat status label
  const label = statusLabels[status] || '';
  chatStatusLabel.textContent = label;
  chatStatusLabel.className = 'chat-status-label ' + status;
  statusSep.style.display = label ? '' : 'none';

  // Topbar status pill
  if (status !== 'idle' && ws && ws.readyState === WebSocket.OPEN) {
    statusPill.className = 'status-pill visible ' + status;
    statusPillLabel.textContent = label;
  } else {
    statusPill.className = 'status-pill';
  }
}

// ─── Chat messages ───────────────────────────────────────────────────────────
function addChatMsg(text, role) {
  chatEmpty.style.display = 'none';
  const row = document.createElement('div');
  row.className = 'msg-row ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMsg(text) {
  chatEmpty.style.display = 'none';
  const row = document.createElement('div');
  row.className = 'msg-row system';
  row.style.alignSelf = 'center';
  row.style.maxWidth = '100%';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendToken(token) {
  chatEmpty.style.display = 'none';
  tokenBuffer += token;

  if (!streamingEl) {
    const row = document.createElement('div');
    row.className = 'msg-row agent';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = tokenBuffer;
    row.appendChild(bubble);
    chatMessages.appendChild(row);
    streamingEl = bubble;
  } else {
    streamingEl.textContent = tokenBuffer;
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function flushTokenBuffer() {
  tokenBuffer = '';
  streamingEl = null;
}

function clearChat() {
  chatMessages.innerHTML = '';
  chatMessages.appendChild(chatEmpty);
  chatEmpty.style.display = '';
  tokenBuffer = '';
  streamingEl = null;
}

function copyChat() {
  const rows = chatMessages.querySelectorAll('.msg-row');
  const lines = [];
  rows.forEach(row => {
    const bubble = row.querySelector('.msg-bubble');
    if (!bubble) return;
    if (row.classList.contains('user')) lines.push('Você: ' + bubble.textContent);
    else if (row.classList.contains('agent')) lines.push('Emma: ' + bubble.textContent);
    else if (row.classList.contains('system')) lines.push('[' + bubble.textContent + ']');
  });
  if (lines.length > 0) {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showToast('Chat copiado!', 'success', 1500);
    });
  }
}

// ─── Sidebar toggle ─────────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const icon = document.getElementById('sidebarToggleIcon');
  const btn = document.getElementById('sidebarToggle');
  const expanded = sidebar.classList.toggle('expanded');
  icon.textContent = expanded ? 'close' : 'menu';
  btn.title = expanded ? 'Recolher menu' : 'Expandir menu';
  try { localStorage.setItem('sidebar-expanded', expanded ? '1' : '0'); } catch {}
}

// Restore sidebar state from localStorage
(function restoreSidebar() {
  try {
    if (localStorage.getItem('sidebar-expanded') === '1') {
      const sidebar = document.getElementById('sidebar');
      const icon = document.getElementById('sidebarToggleIcon');
      const btn = document.getElementById('sidebarToggle');
      sidebar.classList.add('expanded');
      icon.textContent = 'close';
      btn.title = 'Recolher menu';
    }
  } catch {}
})();

// ─── Chat panel toggle ──────────────────────────────────────────────────────
function toggleChat() {
  chatOpen = !chatOpen;
  chatPanel.classList.toggle('open', chatOpen);
  if (chatOpen) chatInput.focus();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
