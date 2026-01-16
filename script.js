document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  /* =========================
     SONS (REGRAS DEFINITIVAS)
     ✔️ confirmar venda
     🗑️ reset total
     🔉 som só no `−` quando remover um balde
  ========================== */
  const plusSound = $("plusSound");
  const minusSound = $("minusSound");
  const trashSound = $("resetSound");

  let soundOn = localStorage.getItem("baldesSound") === "1";
  $("soundToggle").textContent = soundOn ? "🔊" : "🔈";

  $("soundToggle").onclick = () => {
    soundOn = !soundOn;
    localStorage.setItem("baldesSound", soundOn ? "1" : "0");
    $("soundToggle").textContent = soundOn ? "🔊" : "🔈";
  };

  const safePlay = (audio) => {
    if (!soundOn || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  };

  const playMinusSound = () => {
    if (!soundOn || !minusSound) return;
    minusSound.currentTime = 0;
    minusSound.play().catch(() => {});
  };

  const playConfirmSound = () => {
    if (!soundOn || !plusSound) return;
    plusSound.currentTime = 0;
    plusSound.play().catch(() => {});
  };

  const playResetSound = () => {
    if (!soundOn || !trashSound) return;
    trashSound.currentTime = 0;
    trashSound.play().catch(() => {});
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
     ESTADO + LOGS
  ========================== */
  let state = {
    people: [],
    obs: [],
    logs: []
  };

  const save = () => localStorage.setItem("baldesState", JSON.stringify(state));

  const load = () => {
    const raw = localStorage.getItem("baldesState");
    if (raw) {
      try {
        state = JSON.parse(raw);
      } catch {
        state = { people: [], obs: [], logs: [] };
      }
    }
    state.people ||= [];
    state.obs ||= [];
    state.logs ||= [];
  };

  load();

  /* =========================
     BEBIDAS
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
     DATA / HORA
  ========================== */
  const CUTOFF_HOUR = 6;

  const businessDateKey = (ts) => {
    const d = new Date(ts);
    const x = new Date(d);
    if (d.getHours() < CUTOFF_HOUR) x.setDate(x.getDate() - 1);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };

  const formatDateBR = (k) => {
    const [y, m, d] = k.split("-");
    return `${d}/${m}/${y}`;
  };

  const formatTimeBR = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const currentYear = () => new Date().getFullYear();

  /* =========================
     RENDER PEOPLE
  ========================== */
  function renderPeople() {
    const list = $("peopleList");
    list.innerHTML = "";

    state.people.forEach((p) => {
      const wrap = document.createElement("div");
      wrap.className = "person";

      const head = document.createElement("div");
      head.className = "person-header";
      head.innerHTML = `<h3>${p.open ? "▼" : "▶"} ${p.name}</h3>`;
      head.onclick = () => {
        p.open = !p.open;
        save();
        renderPeople();
      };

      const body = document.createElement("div");
      body.className = "person-body";
      if (!p.open) body.classList.add("hidden");

      const selWrap = document.createElement("div");
      selWrap.className = "select-wrapper";

      const sel = document.createElement("select");
      BEERS.forEach((b) => {
        const o = document.createElement("option");
        o.value = o.textContent = b;
        sel.appendChild(o);
      });

      const addB = document.createElement("button");
      addB.textContent = "Adicionar";
      addB.onclick = () => {
        if (!p.beers.some((x) => x.name === sel.value)) {
          p.beers.push({ name: sel.value, pending: 0, confirmed: 0 });
          save();
          renderPeople();
        }
      };

      selWrap.append(sel, addB);
      body.appendChild(selWrap);

      p.beers.forEach((b, i) => {
        const line = document.createElement("div");
        line.className = "beer";
        line.innerHTML = `<strong>${b.name}</strong>
          <span style="color:orange;">⏳ ${b.pending}</span> /
          <span style="color:limegreen;">✅ ${b.confirmed}</span>`;

        const plus = document.createElement("button");
        plus.textContent = "+";
        plus.className = "btn-plus";
        plus.onclick = () => {
          b.pending++;
          save();
          renderPeople();
        };

        const minus = document.createElement("button");
        minus.textContent = "−";
        minus.className = "btn-minus";
        minus.onclick = () => {
          if (!confirm("Remover 1 item?")) return;
          if (b.pending > 0) b.pending--;
          else if (b.confirmed > 0) b.confirmed--;
          playMinusSound(); // 🔊 Som só ao remover 1 balde
          save();
          renderPeople();
        };

        const conf = document.createElement("button");
        conf.textContent = "✔️";
        conf.className = "btn-plus";
        conf.onclick = () => {
          if (b.pending <= 0) return;
          const qty = b.pending;
          b.confirmed += qty;
          b.pending = 0;

          state.logs.push({
            ts: Date.now(),
            person: p.name,
            item: b.name,
            qty
          });

          playConfirmSound(); // 🔊 Som de confirmação
          save();
          renderPeople();
        };

        const del = document.createElement("button");
        del.textContent = "🗑️";
        del.className = "btn-del";
        del.onclick = () => {
          if (!confirm("Excluir este item?")) return;
          p.beers.splice(i, 1);
          save();
          renderPeople();
        };

        line.append(plus, minus, conf, del);
        body.appendChild(line);
      });

      wrap.append(head, body);
      list.appendChild(wrap);
    });
  }

  /* =========================
     HISTÓRICO SIMPLES (SITE)
  ========================== */
  function renderHistory() {
    const section = $("historySection");
    if (section.classList.contains("hidden")) return;

    const div = $("historyList");
    div.innerHTML = "";

    const arr = state.people.map((p) => ({
      name: p.name,
      total: p.beers.reduce((s, b) => s + b.confirmed, 0)
    }));

    const total = arr.reduce((s, x) => s + x.total, 0);
    div.innerHTML = `<h3>Total: ${total}</h3>`;
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
     WHATSAPP (DETALHADO)
  ========================== */
  function buildWhatsappReport() {
    const year = currentYear();

    const logs = state.logs
      .map((x) => ({ ...x, dayKey: businessDateKey(x.ts) }))
      .filter((x) => Number(x.dayKey.slice(0, 4)) === year)
      .sort((a, b) => a.ts - b.ts);

    const byDay = new Map();
    logs.forEach((e) => {
      if (!byDay.has(e.dayKey)) byDay.set(e.dayKey, []);
      byDay.get(e.dayKey).push(e);
    });

    let msg = `*Relatório de Vendas*\n\n`;
    msg += `*Total geral:* ${logs.reduce((s, e) => s + (e.qty || 0), 0)}\n\n`;

    // Resumo por item
    msg += `*Resumo por item*\n`;
    const porItem = new Map();
    logs.forEach((e) => {
      porItem.set(e.item, (porItem.get(e.item) || 0) + e.qty);
    });
    [...porItem.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([item, qty]) => {
        msg += `• ${item}: ${qty}\n`;
      });

    // Resumo por pessoa
    msg += `\n*Resumo por pessoa*\n`;
    const porPessoa = new Map();
    logs.forEach((e) => {
      porPessoa.set(e.person, (porPessoa.get(e.person) || 0) + e.qty);
    });
    [...porPessoa.entries()]
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, qty]) => {
        msg += `• ${name}: ${qty}\n`;
      });

    // Detalhe por dia (dia comercial)
    msg += `\n*Detalhado por dia*\n\n`;
    const days = [...byDay.keys()].sort();
    if (!days.length) {
      msg += `*${formatDateBR(businessDateKey(Date.now()))}*\n`;
    } else {
      days.forEach((d) => {
        msg += `*${formatDateBR(d)}*\n`;
        byDay.get(d).forEach((e) => {
          msg += `- ${formatTimeBR(e.ts)} • ${e.person} • ${e.item} x${e.qty}\n`;
        });
        msg += `\n`;
      });
    }

    // Observações
    if (state.obs.length) {
      msg += `*Observações*\n`;
      state.obs.forEach((o) => {
        msg += `• ${o.text} (${o.time})\n`;
      });
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
  };

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
    if (!confirm("Apagar TODOS os dados?")) return;
    state = { people: [], obs: [], logs: [] };
    save();
    playResetSound(); // 🔊 Som do reset total
    renderAll();
  };

  $("shareWA").onclick = () => {
    const msg = buildWhatsappReport();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  $("obsHeader").onclick = () => $("obsBody").classList.toggle("show");

  renderAll();
});
