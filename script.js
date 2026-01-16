document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  /* =========================
     SONS (somente ao CONFIRMAR)
  ========================== */
  const plusSound = $("plusSound");
  let soundOn = localStorage.getItem("baldesSound") === "1";
  $("soundToggle").textContent = soundOn ? "🔊" : "🔈";

  $("soundToggle").onclick = () => {
    soundOn = !soundOn;
    localStorage.setItem("baldesSound", soundOn ? "1" : "0");
    $("soundToggle").textContent = soundOn ? "🔊" : "🔈";
  };

  const playConfirmSound = () => {
    if (!soundOn || !plusSound) return;
    plusSound.currentTime = 0;
    plusSound.play().catch(() => {});
  };

  /* =========================
     TEMA
  ========================== */
  const root = document.documentElement;
  const setTheme = (t) => {
    root.setAttribute("data-theme", t);
    localStorage.setItem("baldesTheme", t);
    $("toggleTheme").textContent = t === "dark" ? "🌙" : "☀️";
  };

  setTheme(localStorage.getItem("baldesTheme") || "dark");
  $("toggleTheme").onclick = () =>
    setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");

  /* =========================
     ESTADO + "BANCO" (LOGS)
     - people: contadores
     - logs: vendas confirmadas (data/hora)
  ========================== */
  let state = {
    people: [],
    obs: [],
    logs: [] // { ts:number, person:string, item:string, qty:number }
  };

  const save = () => localStorage.setItem("baldesState", JSON.stringify(state));

  const load = () => {
    const raw = localStorage.getItem("baldesState");
    if (raw) {
      try {
        state = JSON.parse(raw);
      } catch {
        // se corromper, reseta seguro
        state = { people: [], obs: [], logs: [] };
      }
    }
    // compatibilidade: garante arrays
    state.people = Array.isArray(state.people) ? state.people : [];
    state.obs = Array.isArray(state.obs) ? state.obs : [];
    state.logs = Array.isArray(state.logs) ? state.logs : [];

    // 🔧 remove "demo" antigo se existir (ex.: um único "igor" vazio)
    const onlyOne =
      state.people.length === 1 &&
      typeof state.people[0]?.name === "string" &&
      state.people[0].name.trim().toLowerCase() === "igor" &&
      Array.isArray(state.people[0].beers) &&
      state.people[0].beers.length === 0 &&
      state.obs.length === 0 &&
      state.logs.length === 0;

    if (onlyOne) {
      state.people = [];
      save();
    }
  };

  load();

  /* =========================
     BEBIDAS (ATUALIZADAS)
  ========================== */
  const BEERS = [
    "Combo de gin",
    "Combo de Smirnoff",
    "Combo de absolute",
    "Balde de lata",
    "Pacote de lata",
    "Amstel 1L",
    "Skol 1L",
    "Bud 1L",
    "Devassa 1L",
    "Amstel 600ml",
    "Budweiser 600ml",
    "Heineken 600ml",
    "Spaten 600ml",
    "Skol 600ml",
    "Tijuca 600ml",
    "Original 600",
    "Skolzinha",
    "Bud Long",
    "GT/senses long",
    "Heineken long",
    "Stella/gold long",
    "Chop de vinho"
  ];

  /* =========================
     UTIL: "DIA COMERCIAL" (madrugada conta no dia anterior)
     - corte padrão: 06:00
  ========================== */
  const CUTOFF_HOUR = 6;

  const businessDateKey = (ts) => {
    const d = new Date(ts);
    const shifted = new Date(d);
    if (d.getHours() < CUTOFF_HOUR) shifted.setDate(shifted.getDate() - 1);

    const yyyy = shifted.getFullYear();
    const mm = String(shifted.getMonth() + 1).padStart(2, "0");
    const dd = String(shifted.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // chave estável
  };

  const formatDateBR = (yyyy_mm_dd) => {
    const [y, m, d] = yyyy_mm_dd.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatTimeBR = (ts) => {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const currentYear = () => new Date().getFullYear();

  /* =========================
     RENDER
  ========================== */
  function renderPeople() {
    const list = $("peopleList");
    list.innerHTML = "";

    state.people.forEach((p, pidx) => {
      const wrap = document.createElement("div");
      wrap.className = "person";

      const head = document.createElement("div");
      head.className = "person-header";
      const h3 = document.createElement("h3");
      h3.textContent = (p.open ? "▼ " : "▶ ") + p.name;
      head.appendChild(h3);
      head.onclick = () => {
        p.open = !p.open;
        save();
        renderPeople();
      };
      wrap.appendChild(head);

      const body = document.createElement("div");
      body.className = "person-body";
      if (!p.open) body.classList.add("hidden");

      const selWrap = document.createElement("div");
      selWrap.className = "select-wrapper";

      const sel = document.createElement("select");
      [...new Set(BEERS)].forEach((b) => {
        const o = document.createElement("option");
        o.value = o.textContent = b;
        sel.appendChild(o);
      });

      const addB = document.createElement("button");
      addB.textContent = "Adicionar";
      addB.className = "btn-plus";
      addB.onclick = () => {
        if (!p.beers.some((x) => x.name === sel.value)) {
          p.beers.push({ name: sel.value, pending: 0, confirmed: 0 });
          save();
          renderPeople();
        }
      };

      selWrap.append(sel, addB);
      body.appendChild(selWrap);

      p.beers.forEach((b, bidx) => {
        const line = document.createElement("div");
        line.className = "beer";
        line.innerHTML = `
          <strong>${b.name}</strong>
          <span style="color:orange;">⏳ ${b.pending}</span> /
          <span style="color:limegreen;">✅ ${b.confirmed}</span>
        `;

        const plus = document.createElement("button");
        plus.textContent = "+";
        plus.className = "btn-plus";
        plus.onclick = () => {
          b.pending++;
          save();
          renderPeople();
          renderHistory();
        };

        const minus = document.createElement("button");
        minus.textContent = "−";
        minus.className = "btn-minus";
        minus.onclick = () => {
          if (!confirm("Remover 1 item?")) return;
          if (b.pending > 0) b.pending--;
          else if (b.confirmed > 0) b.confirmed--;
          navigator.vibrate?.(100);
          save();
          renderPeople();
          renderHistory();
        };

        const conf = document.createElement("button");
        conf.textContent = "✔️";
        conf.className = "btn-plus";
        conf.onclick = () => {
          const moved = b.pending;
          if (moved <= 0) return;

          // move contadores
          b.confirmed += moved;
          b.pending = 0;

          // grava no "banco" (logs)
          const ts = Date.now();
          state.logs.push({
            ts,
            person: p.name,
            item: b.name,
            qty: moved
          });

          // SOM APENAS AQUI ✅
          playConfirmSound();

          save();
          renderPeople();
          renderHistory();
        };

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.className = "btn-del";
        del.onclick = () => {
          if (
            !confirm(
              "Excluir este item?\n(Os pendentes/confirmados serão removidos do contador)"
            )
          )
            return;
          p.beers.splice(bidx, 1);
          save();
          renderPeople();
          renderHistory();
        };

        line.append(plus, minus, conf, del);
        body.appendChild(line);
      });

      wrap.appendChild(body);
      list.appendChild(wrap);
    });
  }

  function renderHistory() {
    const section = $("historySection");
    const div = $("historyList");

    // só renderiza se estiver visível
    if (section.classList.contains("hidden")) return;

    // resumo simples no site (simplificado)
    const arr = state.people
      .map((p) => ({
        name: p.name,
        total: (p.beers || []).reduce((s, b) => s + (b.confirmed || 0), 0)
      }))
      .sort((a, b) => b.total - a.total);

    const totalGeral = arr.reduce((s, x) => s + x.total, 0);

    div.innerHTML = `<h3>Total: ${totalGeral} vendidos</h3>`;
    arr.forEach((o) => {
      const d = document.createElement("div");
      d.textContent = `${o.name}: ${o.total}`;
      div.appendChild(d);
    });
  }

  function renderObs() {
    const ul = $("obsList");
    ul.innerHTML = "";
    state.obs.forEach((o) => {
      const li = document.createElement("li");
      li.textContent = `${o.text} (${o.time})`;
      ul.appendChild(li);
    });
  }

  function renderAll() {
    renderPeople();
    renderObs();
    renderHistory();
  }

  /* =========================
     RELATÓRIO DETALHADO (SOMENTE WHATSAPP)
     - inclui data/hora da confirmação
     - extrato anual (ano atual) com "dia comercial"
  ========================== */
  function buildWhatsappReport() {
    const year = currentYear();

    // filtra logs do ano (pela data comercial)
    const logs = state.logs
      .map((x) => ({ ...x, dayKey: businessDateKey(x.ts) }))
      .filter((x) => Number(x.dayKey.slice(0, 4)) === year)
      .sort((a, b) => a.ts - b.ts);

    // agrupa por dia comercial
    const byDay = new Map();
    for (const e of logs) {
      if (!byDay.has(e.dayKey)) byDay.set(e.dayKey, []);
      byDay.get(e.dayKey).push(e);
    }

    // totais
    const totalPorPessoa = new Map();
    const totalPorItem = new Map();
    let totalGeral = 0;

    for (const e of logs) {
      totalGeral += e.qty;
      totalPorPessoa.set(e.person, (totalPorPessoa.get(e.person) || 0) + e.qty);
      totalPorItem.set(e.item, (totalPorItem.get(e.item) || 0) + e.qty);
    }

    // monta mensagem
    let msg = `*Extrato Anual (vendas confirmadas)*\nAno: *${year}*\nCorte madrugada: *00:00–05:59 conta no dia anterior*\n\n`;
    msg += `*Total geral:* ${totalGeral}\n\n`;

    // resumo por pessoa
    if (totalPorPessoa.size) {
      msg += `*Resumo por pessoa*\n`;
      [...totalPorPessoa.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, qty]) => {
          msg += `• ${name}: ${qty}\n`;
        });
      msg += `\n`;
    }

    // resumo por item
    if (totalPorItem.size) {
      msg += `*Resumo por item*\n`;
      [...totalPorItem.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([item, qty]) => {
          msg += `• ${item}: ${qty}\n`;
        });
      msg += `\n`;
    }

    // detalhado por dia
    msg += `*Detalhado (por dia comercial)*\n`;
    const days = [...byDay.keys()].sort();
    if (!days.length) {
      msg += `— Sem registros confirmados neste ano —\n\n`;
    } else {
      for (const dayKey of days) {
        msg += `\n*${formatDateBR(dayKey)}*\n`;
        for (const e of byDay.get(dayKey)) {
          // mostra hora real em que foi confirmado
          msg += `- ${formatTimeBR(e.ts)} • ${e.person} • ${e.item} x${e.qty}\n`;
        }
      }
      msg += `\n`;
    }

    // observações
    msg += `*Observações*\n`;
    if (state.obs.length) {
      state.obs.forEach((o) => {
        msg += `• ${o.text} (${o.time})\n`;
      });
    } else {
      msg += `Nenhuma observação\n`;
    }

    return msg;
  }

  /* =========================
     AÇÕES
  ========================== */
  $("addPerson").onclick = () => {
    const name = $("personName").value.trim();
    if (!name) return;

    state.people.push({ name, beers: [], open: true });
    $("personName").value = "";
    save();
    renderPeople();
    renderHistory();
  };

  // Botão do "relatório" agora só mostra/oculta o HISTÓRICO (site simplificado)
  $("historyToggle").onclick = () => {
    $("historySection").classList.toggle("hidden");
    renderHistory();
  };

  $("addObs").onclick = () => {
    const txt = $("obsText").value.trim();
    if (!txt) return;
    state.obs.unshift({ text: txt, time: new Date().toLocaleString() });
    $("obsText").value = "";
    save();
    renderObs();
  };

  $("resetAll").onclick = () => {
    if (!confirm("Apagar TODOS os dados (pessoas, observações e extratos)?")) return;
    state = { people: [], obs: [], logs: [] };
    save();
    renderAll();
  };

  // WhatsApp: envia SEMPRE o relatório detalhado com data/hora e extrato anual
  $("shareWA").onclick = () => {
    const msg = buildWhatsappReport();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  /* =========================
     COLLAPSIBLE OBS
  ========================== */
  const obsHeader = $("obsHeader");
  const obsBody = $("obsBody");
  if (obsHeader && obsBody) {
    obsHeader.addEventListener("click", () => obsBody.classList.toggle("show"));
  }

  renderAll();
});
