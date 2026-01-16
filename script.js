document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  /* ========= SONS ========= */
  const plusSound = $('plusSound');
  const minusSound = $('minusSound');
  const trashSound = $('resetSound');

  let soundOn = localStorage.getItem('baldesSound') === '1';
  $('soundToggle').textContent = soundOn ? '🔊' : '🔈';

  $('soundToggle').onclick = () => {
    soundOn = !soundOn;
    localStorage.setItem('baldesSound', soundOn ? '1' : '0');
    $('soundToggle').textContent = soundOn ? '🔊' : '🔈';
  };

  const safePlay = audio => {
    if (soundOn && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  /* ========= TEMA ========= */
  const root = document.documentElement;
  const setTheme = theme => {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('baldesTheme', theme);
    $('toggleTheme').textContent = theme === 'dark' ? '🌙' : '☀️';
  };

  setTheme(localStorage.getItem('baldesTheme') || 'dark');
  $('toggleTheme').onclick = () =>
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');

  /* ========= ESTADO ========= */
  let state = {
    people: [],
    obs: [],
    detailed: false
  };

  const save = () =>
    localStorage.setItem('baldesState', JSON.stringify(state));

  const load = () => {
    const data = localStorage.getItem('baldesState');
    if (data) state = JSON.parse(data);
  };

  load();

  /* ========= BEBIDAS (ATUALIZADAS) ========= */
  const BEERS = [
    'Combo de gin',
    'Combo de Smirnoff',
    'Combo de absolute',
    'Balde de lata',
    'Pacote de lata',
    'Amstel 1L',
    'Skol 1L',
    'Bud 1L',
    'Devassa 1L',
    'Amstel 600ml',
    'Budweiser 600ml',
    'Heineken 600ml',
    'Spaten 600ml',
    'Skol 600ml',
    'Tijuca 600ml',
    'Original 600',
    'Skolzinha',
    'Bud Long',
    'GT/senses long',
    'Heineken long',
    'Stella/gold long',
    'Chop de vinho'
  ];

  /* ========= RENDER PEOPLE ========= */
  function renderPeople() {
    const list = $('peopleList');
    list.innerHTML = '';

    state.people.forEach((p, pidx) => {
      const wrap = document.createElement('div');
      wrap.className = 'person';

      const header = document.createElement('div');
      header.className = 'person-header';
      header.innerHTML = `<h3>${p.open ? '▼' : '▶'} ${p.name}</h3>`;
      header.onclick = () => {
        p.open = !p.open;
        save();
        renderPeople();
      };

      const body = document.createElement('div');
      body.className = 'person-body';
      if (!p.open) body.classList.add('hidden');

      const selWrap = document.createElement('div');
      selWrap.className = 'select-wrapper';

      const select = document.createElement('select');
      [...new Set(BEERS)].forEach(b => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = b;
        select.appendChild(opt);
      });

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Adicionar';
      addBtn.className = 'btn-plus';
      addBtn.onclick = () => {
        if (!p.beers.some(x => x.name === select.value)) {
          p.beers.push({ name: select.value, pending: 0, confirmed: 0 });
          safePlay(plusSound);
          save();
          renderAll();
        }
      };

      selWrap.append(select, addBtn);
      body.appendChild(selWrap);

      p.beers.forEach((b, bidx) => {
        const line = document.createElement('div');
        line.className = 'beer';
        line.innerHTML = `
          <strong>${b.name}</strong>
          <span style="color:orange;">⏳ ${b.pending}</span> /
          <span style="color:limegreen;">✅ ${b.confirmed}</span>
        `;

        const plus = document.createElement('button');
        plus.textContent = '+';
        plus.className = 'btn-plus';
        plus.onclick = () => {
          b.pending++;
          safePlay(plusSound);
          save();
          renderAll();
        };

        const minus = document.createElement('button');
        minus.textContent = '−';
        minus.className = 'btn-minus';
        minus.onclick = () => {
          if (!confirm('Remover 1 item?')) return;
          if (b.pending > 0) b.pending--;
          else if (b.confirmed > 0) b.confirmed--;
          safePlay(minusSound);
          navigator.vibrate?.(100);
          save();
          renderAll();
        };

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '✔️';
        confirmBtn.className = 'btn-plus';
        confirmBtn.onclick = () => {
          if (b.pending > 0) {
            b.confirmed += b.pending;
            b.pending = 0;
            safePlay(plusSound);
            save();
            renderAll();
          }
        };

        const del = document.createElement('button');
        del.textContent = '🗑️';
        del.className = 'btn-del';
        del.onclick = () => {
          if (!confirm('Excluir este item?')) return;
          p.beers.splice(bidx, 1);
          safePlay(trashSound);
          save();
          renderAll();
        };

        line.append(plus, minus, confirmBtn, del);
        body.appendChild(line);
      });

      wrap.append(header, body);
      list.appendChild(wrap);
    });
  }

  /* ========= HISTÓRICO ========= */
  function renderHistory() {
    const div = $('historyList');
    div.innerHTML = '';

    let totalGeral = 0;

    state.people.forEach(p => {
      const total = p.beers.reduce((s, b) => s + b.confirmed, 0);
      totalGeral += total;
      const d = document.createElement('div');
      d.textContent = `${p.name}: ${total}`;
      div.appendChild(d);
    });

    const h3 = document.createElement('h3');
    h3.textContent = `Total geral: ${totalGeral}`;
    div.prepend(h3);

    if (state.detailed) renderDetailed(div);
  }

  /* ========= RELATÓRIO DETALHADO ========= */
  function renderDetailed(container) {
    const block = document.createElement('div');
    block.style.marginTop = '1rem';
    block.innerHTML = '<h3>📄 Relatório Detalhado</h3>';

    state.people.forEach(p => {
      const sec = document.createElement('div');
      sec.innerHTML = `<strong>${p.name}</strong>`;
      p.beers.forEach(b => {
        const line = document.createElement('div');
        line.style.marginLeft = '1rem';
        line.textContent = `${b.name} → ⏳ ${b.pending} | ✅ ${b.confirmed}`;
        sec.appendChild(line);
      });
      block.appendChild(sec);
    });

    container.appendChild(block);
  }

  /* ========= OBS ========= */
  function renderObs() {
    const ul = $('obsList');
    ul.innerHTML = '';
    state.obs.forEach(o => {
      const li = document.createElement('li');
      li.textContent = `${o.text} (${o.time})`;
      ul.appendChild(li);
    });
  }

  function renderAll() {
    renderPeople();
    renderHistory();
    renderObs();
  }

  /* ========= AÇÕES ========= */
  $('addPerson').onclick = () => {
    const name = $('personName').value.trim();
    if (!name) return;
    state.people.push({ name, beers: [], open: true });
    $('personName').value = '';
    save();
    renderAll();
  };

  $('historyToggle').onclick = () => {
    state.detailed = !state.detailed;
    save();
    renderHistory();
  };

  $('addObs').onclick = () => {
    const txt = $('obsText').value.trim();
    if (!txt) return;
    state.obs.unshift({ text: txt, time: new Date().toLocaleString() });
    $('obsText').value = '';
    save();
    renderObs();
  };

  $('resetAll').onclick = () => {
    if (!confirm('Apagar TODOS os dados?')) return;
    state = { people: [], obs: [], detailed: false };
    save();
    safePlay(trashSound);
    renderAll();
  };

  $('shareWA').onclick = () => {
    let msg = '*Relatório de Baldes*\n\n';

    state.people.forEach(p => {
      msg += `*${p.name}*\n`;
      p.beers.forEach(b => {
        msg += `- ${b.name}: ⏳ ${b.pending} | ✅ ${b.confirmed}\n`;
      });
      msg += '\n';
    });

    if (state.obs.length) {
      msg += '*Observações*\n';
      state.obs.forEach(o => {
        msg += `• ${o.text} (${o.time})\n`;
      });
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  /* ========= COLLAPSIBLE OBS ========= */
  const obsHeader = $('obsHeader');
  const obsBody = $('obsBody');
  obsHeader.onclick = () => obsBody.classList.toggle('show');

  renderAll();
});
