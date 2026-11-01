(() => {
  const STORAGE_KEY = 'last-online-prototype-v1';
  const defaults = {
    scene: 1,
    outcome: 'c',
    verifyChoice: null,
    callChoice: null,
    risk: 0,
    shadowStages: {},
    protection: 0,
    time: '21:47',
    flags: { openedLink: false, repliedInChat: false, calledMessageNumber: false, askedSameChatAgain: false, sentFileAfterCall: false, calledChatNumber: false },
    sound: true,
    subtitles: true
  };

  let state = loadState();
  const previewScene = new URLSearchParams(window.location.search).get('preview');
  if (previewScene === 'author') state.scene = 27;
  else if (/^(?:[1-9]|1\d|2[0-7])$/.test(previewScene || '')) state.scene = Number(previewScene);
  let callSequenceId = 0;
  let marinaSequenceId = 0;
  let securitySequenceId = 0;
  const scene = document.querySelector('#scene');
  const hud = document.querySelector('#hud');
  const live = document.querySelector('#live-region');
  const ambient = document.querySelector('#ambient-music');
  const ambientVolume = .13;
  ambient.volume = ambientVolume;

  function syncAmbient() {
    if (state.sound) {
      if (ambient.paused) ambient.play().catch(() => {});
    } else ambient.pause();
  }

  function setSound(enabled) {
    state.sound = enabled;
    saveState();
    updateHud();
    ambient.volume = ambientVolume;
    syncAmbient();
    const effect = scene.querySelector('audio');
    if (effect && !enabled) effect.pause();
    if (effect && enabled && state.scene === 17) {
      effect.currentTime = 0;
      ambient.volume = .055;
      effect.play().catch(() => { ambient.volume = ambientVolume; });
    }
    if (effect && enabled && state.scene === 25) {
      effect.currentTime = 0;
      ambient.volume = .055;
      effect.play().catch(() => { ambient.volume = ambientVolume; });
    }
    if (effect && enabled && state.scene === 26) {
      effect.currentTime = 0;
      ambient.volume = .055;
      effect.play().catch(() => { ambient.volume = ambientVolume; });
    }
    announce(enabled ? 'Звук включён' : 'Звук выключен');
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return structuredClone(defaults);
      const merged = { ...defaults, ...saved, flags: { ...defaults.flags, ...(saved.flags || {}) } };
      if (!saved.shadowStages) {
        merged.shadowStages = {
          first: !!(merged.flags.openedLink || merged.flags.repliedInChat),
          verify: !!(merged.flags.calledMessageNumber || merged.flags.askedSameChatAgain),
          call: !!(merged.flags.sentFileAfterCall || merged.flags.calledChatNumber)
        };
        merged.risk = Math.min(3, Object.values(merged.shadowStages).filter(Boolean).length);
      } else {
        merged.shadowStages = { ...saved.shadowStages };
        merged.risk = Math.min(3, Math.max(0, Number(saved.risk) || 0));
      }
      return merged;
    } catch (_) {
      return structuredClone(defaults);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function strengthenShadow(stage) {
    if (state.shadowStages[stage]) return false;
    state.shadowStages[stage] = true;
    const oldRisk = state.risk;
    state.risk = Math.min(3, state.risk + 1);
    saveState();
    updateHud();
    return state.risk > oldRisk;
  }

  function announce(text) {
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 20);
  }

  function tone(frequency = 380, duration = .07) {
    if (!state.sound) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  function setScene(number) {
    state.scene = number;
    const times = { 1:'21:47', 2:'21:47', 3:'21:47', 4:'21:47', 5:'21:47', 6:'21:47', 7:'21:48', 8:'21:48', 9:'21:49', 10:'21:49', 11:'21:50', 12:'21:51', 13:'21:52', 14:'21:52', 15:'21:53', 16:'21:55', 17:'21:56', 18:'21:57', 19:'21:57', 20:'21:57', 21:'21:57', 22:'21:57', 23:'21:58', 26:'21:59' };
    state.time = times[number] || state.time;
    if (number === 9 || number === 10 || number === 11) state.protection = Math.max(state.protection, 1);
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateHud() {
    const visible = state.scene >= 1 && state.scene <= 26;
    hud.hidden = !visible;
    document.querySelector('#hud-time').textContent = state.time;
    document.querySelector('#hud-risk').textContent = `${state.risk}/3`;
    document.querySelector('#course').dataset.shadow = String(state.risk);
    document.querySelector('#shadow-dots').innerHTML = Array.from({ length: 3 }, (_, i) => `<i class="${i < state.risk ? 'active' : ''}"></i>`).join('');
    document.querySelector('#hud-protection').textContent = `${state.protection}/5`;
    document.querySelector('#protection-dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < state.protection ? 'active' : ''}"></i>`).join('');
    const soundButton = document.querySelector('#sound-toggle');
    soundButton.setAttribute('aria-pressed', String(state.sound));
    soundButton.textContent = state.sound ? '◉' : '○';
  }

  function button(label, action, secondary = false) {
    return `<button class="${secondary ? 'secondary-button' : 'primary-button'}" type="button" data-action="${action}">${label}</button>`;
  }

  function titleScene() {
    return `
      <div class="content content--title">
        <div class="hero">
          <p class="eyebrow">Интерактивная история</p>
          <h1 id="scene-title">Последний<br>онлайн</h1>
          <p class="lead"><span class="lead__line">Офис продолжил работать после ухода сотрудников.</span><span class="lead__line">Сегодня вы остались здесь последней.</span></p>
          <div class="title-actions">
            ${button('Начать ночную смену', 'next')}
            ${state.scene > 1 ? button('Продолжить с экрана ' + state.scene, 'resume', true) : ''}
          </div>
          <div class="status-line"><span class="signal-dot"></span><span>один сотрудник в сети</span></div>
        </div>
      </div>`;
  }

  function rulesScene() {
    return `
      <div class="content">
        <div class="story-overlay interface-guide">
          <p class="eyebrow">Как читать экран</p>
          <h2 id="scene-title">Панель ночной смены</h2>

          <div class="guide-hud" aria-label="Пример панели курса">
            <div class="guide-metric">
              <span>Время</span><strong>21:47</strong>
            </div>
            <div class="guide-metric">
              <span>Сила Тени</span><strong>0/3</strong>
            </div>
            <div class="guide-metric guide-metric--progress">
              <span>Защита</span><strong>0/5</strong>
              <div class="guide-segments" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
            </div>
            <div class="guide-controls" aria-hidden="true"><b>◉</b><b>⛶</b></div>
          </div>

          <div class="guide-list">
            <div class="guide-item"><strong>Время</strong><span>Двигает сюжет вперёд. Таймера и штрафа за паузу нет.</span></div>
            <div class="guide-item"><strong>Сила Тени 0/3</strong><span>Первый рискованный ответ в задании усиливает Тень на 1, максимум — 3. Повторная ошибка в том же задании силу не меняет.</span></div>
            <div class="guide-item"><strong>Защита 0/5</strong><span>Ваш игровой прогресс. Индикатор показывает, сколько защитных решений вы нашли в истории. Всего их пять.</span></div>
          </div>

          <div class="guide-actions">
            ${button('Продолжить', 'next')}
            <p class="microcopy"><b>◉</b> звук&nbsp;&nbsp; <b>⛶</b> полный экран<br>Tab — переход, Enter — выбор.</p>
          </div>
        </div>
      </div>`;
  }

  function timeScene() {
    return `
      <div class="content cinematic">
        <div class="cinematic-copy">
          <p class="eyebrow">Ночная смена</p>
          <div class="time-display">21:47</div>
          <h2 id="scene-title">Офис опустел двадцать минут назад</h2>
          <p class="lead">Ника заканчивает отчёт перед утренней встречей. В соседних рядах спят погасшие мониторы.</p>
          <p class="subtitle">«Ещё две таблицы».</p>
          ${button('Продолжить', 'next')}
        </div>
      </div>`;
  }

  function nikaScene() {
    return `
      <div class="content">
        <div class="nika-story">
          <p class="eyebrow">Вы играете за Нику</p>
          <h2 id="scene-title">Ника Орлова</h2>
          <p class="nika-story__role">аналитик · ночная смена</p>
          <p class="lead">На соседнем мониторе загорается значок корпоративного чата. Сообщение пришло не из рабочей группы.</p>
          <p class="subtitle">«Кто ещё не спит?»</p>
          ${button('Открыть чат', 'next')}
        </div>
      </div>`;
  }

  function chatShell(inner, footer = '') {
    return `
      <div class="chat-stage">
        <div class="monitor-chat chat-shell" aria-label="Корпоративный чат на мониторе Ники">
          <aside class="chat-sidebar" aria-label="Контакты">
            <div class="chat-sidebar__title">☰ &nbsp; Сообщения <span>⌕</span></div>
            <div class="contact active">
              <div class="avatar" role="img" aria-label="Портрет Артёма Крылова"></div>
              <div class="contact__info"><strong>Артём Крылов</strong><span>Последнее сообщение · 21:47</span></div>
            </div>
          </aside>
          <div class="chat-main">
            <header class="chat-header">
              <div class="avatar" role="img" aria-label="Портрет Артёма Крылова"></div>
              <div class="chat-header__meta"><strong>Артём Крылов</strong><span>в сети</span></div>
              <span class="chat-header__menu" aria-hidden="true">⌕ &nbsp; ⋮</span>
            </header>
            <div class="chat-body">${inner}</div>
            <div class="chat-composer" aria-hidden="true"><span>⊕</span><span>Сообщение...</span><span>☺ &nbsp; 🎙</span></div>
          </div>
        </div>
        ${footer ? `<div class="chat-stage__action">${footer}</div>` : ''}
      </div>`;
  }

  function onlineScene() {
    const inner = `
      <div class="system-note">был в сети 164 дня назад</div>
      <div class="message">
        <div class="message__meta"><span>Система</span><time>21:47</time></div>
        <p>Статус пользователя изменён: <strong class="online">в сети</strong></p>
      </div>
      <div class="typing">Артём Крылов печатает<span>…</span></div>`;
    return `<div class="content content--chat">${chatShell(inner, button('Открыть сообщение', 'next'))}</div>`;
  }

  function messageMarkup() {
    return `
      <div class="system-note">новое сообщение</div>
      <div class="message">
        <div class="message__meta"><span>Артём Крылов</span><time>21:47</time></div>
        <p>Ника, ты ещё в офисе? Очень выручишь.</p>
        <p>Срочно загрузи файл с клиентскими условиями. Руководство ждёт до утра.</p>
        <p>Только не пиши в общий чат.</p>
        <button class="attachment" type="button" tabindex="-1">Папка для загрузки<small>company-docs.support/files/9271</small></button>
      </div>`;
  }

  function messageScene() {
    return `<div class="content content--chat">${chatShell(messageMarkup(), button('Решить, что делать', 'next'))}</div>`;
  }

  function decisionScene() {
    return `
      <div class="content content--chat">
        <div class="chat-stage">
          <div class="monitor-chat decision-screen">
            <header class="decision-screen__header">
              <span class="decision-screen__back" aria-hidden="true">‹</span>
              <span class="avatar" role="img" aria-label="Портрет Артёма Крылова"></span>
              <span><strong>Артём Крылов</strong><small>в сети</small></span>
              <span class="decision-screen__menu" aria-hidden="true">⌕ &nbsp; ⋮</span>
            </header>
            <div class="decision-screen__body">
              <div class="decision-screen__context">
                <p class="decision-screen__label">Сообщение · 21:47</p>
                <div class="decision-screen__bubble">
                  <strong>Артём Крылов</strong>
                  <p>Срочно загрузи файл с клиентскими условиями. Руководство ждёт до утра. Только не пиши в общий чат.</p>
                  <span>company-docs.support/files/9271</span>
                </div>
                <p class="decision-screen__thought">Ника: «Почему он просит об этом меня?»</p>
              </div>
              <div class="decision-screen__choices">
                <p class="decision-screen__label">Первое решение</p>
                <h2 id="scene-title">Что вы сделаете?</h2>
                <div class="choices">
                  <button class="choice ${state.flags.openedLink ? 'seen' : ''}" type="button" data-choice="a"><b>1</b>Открою ссылку и посмотрю, куда загрузить файл.</button>
                  <button class="choice ${state.flags.repliedInChat ? 'seen' : ''}" type="button" data-choice="b"><b>2</b>Спрошу здесь: «Артём, это точно ты?»</button>
                  <button class="choice" type="button" data-choice="c"><b>3</b>Сначала проверю просьбу и отправителя.</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function pauseScene() {
    const variants = {
      a: {
        eyebrow: 'Вариант 1 · ссылка открыта',
        title: 'Тень ждёт файл',
        message: 'На внешней странице появляется поле: «Загрузите файл с клиентскими условиями».',
        thought: 'Ника: «Я ещё ничего не отправила. Надо остановиться».',
        lesson: 'Адрес из чата ведёт за пределы компании. Не загружайте туда закрытые файлы. Проверьте просьбу другим способом.',
        action: 'Вернуться к решению',
        next: 'retry-choice'
      },
      b: {
        eyebrow: 'Вариант 2 · ответ в том же чате',
        title: 'Тень знает детали',
        message: '«Конечно я. Мы вместе готовили мартовский отчёт. Ника, времени нет».',
        thought: 'Ника: «Он помнит отчёт. Но эти слова могли остаться в переписке».',
        lesson: 'Ответ из подозрительного аккаунта не подтверждает личность. Свяжитесь с человеком через контакт, найденный независимо от этого чата.',
        action: 'Вернуться к решению',
        next: 'retry-choice'
      },
      c: {
        eyebrow: 'Вариант 3 · проверка до действия',
        title: 'Пауза остановила Тень',
        message: 'Сообщение остаётся на экране. Ника убирает руку от клавиатуры.',
        thought: 'Ника: «Сначала выясню, кто пишет и куда ведёт ссылка».',
        lesson: 'Первый шаг защиты — Стоп. Неожиданная срочная просьба о закрытом файле требует проверки. Защита: 1/5.',
        action: 'Проверить отправителя',
        next: 'next'
      }
    };
    const v = variants[state.outcome] || variants.c;
    return `
      <div class="content content--outcome">
        <div class="outcome-panel">
          <p class="eyebrow">${v.eyebrow}</p>
          <h2 id="scene-title">${v.title}</h2>
          <div class="outcome-message"><span>НА ЭКРАНЕ НИКИ</span><p>${v.message}</p></div>
          <p class="outcome-thought">${v.thought}</p>
          <div class="outcome-lesson"><span>${state.outcome === 'c' ? 'ШАГ ЗАЩИТЫ 1/5' : 'РАЗБОР РЕШЕНИЯ'}</span><p>${v.lesson}</p></div>
          ${state.outcome !== 'c' ? `<p class="outcome-shadow">Сила Тени: ${state.risk}/3</p>` : ''}
          ${button(v.action, v.next)}
          </div>
      </div>`;
  }

  function protectionScene() {
    return `
      <div class="content content--theory">
        <div class="theory-panel">
          <p class="eyebrow">Первый шаг защиты · 1/5</p>
          <h2 id="scene-title">СТОП</h2>
          <p class="theory-lead">Неожиданная просьба, спешка и закрытый файл — три повода остановиться.</p>
          <div class="theory-rule">
            <span>ПОКА НЕ ПРОВЕРИЛИ</span>
            <p>Не открывайте ссылку, не отправляйте файл и не подтверждайте личность собеседника в том же чате.</p>
          </div>
          <p class="theory-note">Пауза даёт время связаться с человеком через контакт, найденный независимо от сообщения.</p>
          <p class="theory-quote">«Тень торопит. Значит, ей мешает пауза».</p>
          ${button('Проверить отправителя', 'next')}
        </div>
      </div>`;
  }

  function mapScene() {
    return `
      <div class="content">
        <div class="map-copy">
          <p class="eyebrow">Карта этажа</p>
          <h2 id="scene-title">Первая локация</h2>
          <div class="objective"><strong>Задача:</strong><br>узнайте, почему профиль Артёма снова активен.</div>
          <p class="subtitle">«В архиве хранится история отключённых учётных записей».</p>
          <p class="microcopy">Выберите светящийся терминал в архиве.</p>
        </div>
        <div class="map-nika" role="img" aria-label="Ника находится у рабочего места">
          <span class="map-nika__label">Ника</span>
          <div class="nika-sprite" aria-hidden="true"><img src="assets/nika-map-sprites.png" alt=""></div>
        </div>
        <button class="map-hotspot" type="button" data-action="archive" aria-label="Перейти в архив сотрудников"><span>Архив сотрудников</span></button>
      </div>`;
  }

  function endScene() {
    return `
      <div class="content content--archive">
        <div class="archive-panel">
          <p class="eyebrow">Раздел 1 завершён · Архив</p>
          <h2 id="scene-title">Архив открыт</h2>
          <p class="archive-story">В пустой комнате горит терминал. Ника подходит ближе и видит запись в журнале:</p>
          <div class="archive-record"><span>ПОСЛЕДНИЙ ВХОД</span><strong>Артём Крылов · сегодня, 21:47</strong></div>
          <p class="archive-hook">Кто вошёл под его именем — и зачем просил закрытый файл?</p>
          <div class="archive-next">
            <span>ДАЛЬШЕ</span>
            <p>Проверить учётную запись и не раскрыть корпоративные данные.</p>
          </div>
          <div class="archive-actions">
            ${button('Перейти к главе 2', 'next')}
            ${button('Пройти раздел ещё раз', 'reset', true)}
          </div>
        </div>
      </div>`;
  }

  function chapterTwoScene() {
    return `
      <div class="content content--archive">
        <div class="archive-panel">
          <p class="eyebrow">Глава 2 · Проверка отправителя</p>
          <h2 id="scene-title">Кто вошёл?</h2>
          <p class="archive-story">Ника открывает журнал учётных записей. Профиль Артёма активен с 21:47 — в ту минуту, когда пришло сообщение.</p>
          <div class="archive-record"><span>ВАЖНАЯ УЛИКА</span><strong>Аккаунт ≠ человек</strong></div>
          <p class="archive-hook">Сообщение действительно пришло с его аккаунта. Но это ещё не доказывает, что пишет сам Артём.</p>
          <div class="archive-next"><span>ЗАДАЧА ГЛАВЫ</span><p>Проверить личность через независимый контакт и сохранить закрытый файл в компании.</p></div>
          ${button('Проверить Артёма', 'next')}
        </div>
      </div>`;
  }

  function verifyScene() {
    return `
      <div class="content content--archive">
        <div class="archive-panel">
          <p class="eyebrow">Глава 2 · Следующий шаг</p>
          <h2 id="scene-title">Где проверить Артёма?</h2>
          <p class="archive-story">Чат подтверждает только аккаунт, а не человека. Чтобы выяснить, кто просит закрытый файл, Нике нужен контакт, который она найдёт сама.</p>
          <div class="archive-record"><span>ЗАДАЧА</span><strong>Найти Артёма через корпоративный справочник.</strong></div>
          <p class="archive-hook">Номер и ссылки из подозрительного сообщения не подходят: их мог оставить тот, кто пишет от его имени.</p>
          ${button('Открыть справочник', 'next')}
        </div>
      </div>`;
  }

  function directoryScene() {
    const feedback = {
      a: '<strong>Рискованный выбор.</strong> Номер прислал тот же подозрительный аккаунт. Он может привести к мошеннику.',
      b: '<strong>Верно. Защита 2/5.</strong> Рабочий номер найден в независимом корпоративном справочнике. Теперь Ника может проверить просьбу.',
      c: '<strong>Проверка не состоялась.</strong> На вопрос в чате ответит тот, кто сейчас управляет аккаунтом.'
    };
    return `
      <div class="directory-stage">
        <div class="directory-choice-box">
          <p class="eyebrow">Глава 2 · Сверь отправителя</p>
          <h2 id="scene-title">Как проверить просьбу?</h2>
          <div class="directory-choices">
            <button type="button" data-verify-choice="a" class="directory-choice ${state.verifyChoice === 'a' ? 'is-selected' : ''}"><b>1</b><span>Позвонить по номеру из сообщения</span></button>
            <button type="button" data-verify-choice="b" class="directory-choice ${state.verifyChoice === 'b' ? 'is-selected' : ''}"><b>2</b><span>Позвонить по рабочему номеру 314</span></button>
            <button type="button" data-verify-choice="c" class="directory-choice ${state.verifyChoice === 'c' ? 'is-selected' : ''}"><b>3</b><span>Спросить в том же чате</span></button>
          </div>
          ${state.verifyChoice ? `<div class="directory-feedback" role="status">${feedback[state.verifyChoice]}${state.verifyChoice === 'b' ? `<button class="directory-next" type="button" data-action="next">Позвонить 314</button>` : ''}</div>` : ''}
        </div>
      </div>`;
  }

  function callScene() {
    return `
      <div class="call-stage" aria-label="Ника звонит Артёму по номеру 314">
        <div class="call-hands call-hands--dial" aria-hidden="true"></div>
        <div class="call-hands call-hands--calling" aria-hidden="true"></div>
        <div class="call-quote" aria-live="polite"><p class="eyebrow">Глава 2 · Независимый звонок</p><p><strong>Ника:</strong> «Телефон звонит в кабинете Б-24… но никто не отвечает».</p></div>
        <div class="call-question">
          <p class="eyebrow">Глава 2 · Решение</p>
          <h2 id="scene-title">Что делать дальше?</h2>
          <p class="call-context">Рабочий номер не отвечает. В чате снова торопят с закрытым файлом.</p>
          <div class="call-options">
            <button type="button" data-call-choice="a" class="directory-choice"><b>1</b><span>Отправить файл</span></button>
            <button type="button" data-call-choice="b" class="directory-choice"><b>2</b><span>Связаться с Мариной по справочнику</span></button>
            <button type="button" data-call-choice="c" class="directory-choice"><b>3</b><span>Позвонить по номеру из чата</span></button>
          </div>
          <div class="call-feedback" role="status"></div>
          <button class="call-next" type="button" data-action="next">Написать Марине</button>
          <button class="call-replay" type="button" data-action="replay-call">Повторить звонок</button>
        </div>
        <audio id="archive-ringtone" preload="auto" src="assets/archive-ringtone.mp3"></audio>
      </div>`;
  }

  function marinaScene() {
    return `
      <div class="marina-chat">
        <div class="marina-chat__header"><span class="marina-avatar">М</span><div><strong>Марина</strong><small>Корпоративный чат · рабочий контакт</small></div></div>
        <div class="marina-chat__body">
          <p class="marina-message marina-message--nika" data-marina-step="nika"><strong>Ника · 21:55</strong><span>Мне пишут с аккаунта Артёма и просят срочно отправить клиентский файл по ссылке. Я ничего не отправляла. Можешь уточнить, это его просьба?</span></p>
          <p class="marina-message" data-marina-step="first"><strong>Марина</strong><span>У меня сохранился личный номер Артёма. Сейчас свяжусь с ним и напишу тебе.</span></p>
          <p class="marina-typing" data-marina-step="typing">Марина печатает<span aria-hidden="true">…</span></p>
          <p class="marina-message" data-marina-step="answer"><strong>Марина</strong><span>Я только что говорила с Артёмом. Он не отправлял тебе ссылку и не просил клиентский файл. Ничего не отправляй.</span></p>
          <p class="marina-thought" data-marina-step="thought">Ника: «Значит, аккаунтом пользуется кто-то другой. Сохраню переписку и сообщу о подозрительном запросе».</p>
        </div>
      </div>
      <button class="marina-next" type="button" data-action="next">К итогам проверки</button>`;
  }

  function verificationEndScene() {
    return `
      <div class="verification-end">
        <p class="eyebrow">Глава 2 · Итог проверки</p>
        <h2 id="scene-title">Подмена раскрыта</h2>
        <p>Марина подтвердила по личному номеру: Артём не просил клиентский файл. Сообщения из его аккаунта нельзя считать подтверждением личности.</p>
        <div class="verification-end__steps">
          <span>Не открывать ссылку</span>
          <span>Не отправлять закрытые данные</span>
          <span>Сохранить переписку и сообщить о запросе</span>
        </div>
        ${button('Перейти в главу 3', 'next')}
        ${button('Начать историю заново', 'reset', true)}
      </div>
      <audio id="archive-door-creak" preload="auto" src="assets/archive-door-creak.mp3"></audio>`;
  }

  function shadowDoorScene() {
    return `
      <div class="shadow-story">
        <p class="eyebrow">Глава 3 · Следы</p>
        <h2 id="scene-title" class="sr-only">Новое сообщение в архиве</h2>
        <p class="shadow-story__thought"><strong>Ника:</strong> «Марина подтвердила: это не Артём. Кто-то пишет от его имени. Нужно сохранить переписку».</p>
        ${button('Рассмотреть переписку', 'open-shadow-chat')}
        ${button('Перейти к заданию', 'next', true)}
      </div>
      <button class="shadow-back" type="button" data-action="close-shadow-chat" hidden>Вернуться к сцене</button>`;
  }

  function evidenceScene() {
    return `<div class="evidence-panel">
      <p class="eyebrow">Глава 3 · Сохранить следы</p>
      <h2 id="scene-title">Что стоит сохранить?</h2>
      <p class="evidence-intro">Ника: «Нужно помочь коллегам разобраться, не открывая ссылку и не отправляя файл».</p>
      <div class="evidence-options" role="radiogroup" aria-label="Выберите ответ">
        <button type="button" class="directory-choice" data-evidence-choice="a" role="radio" aria-checked="false"><b>1</b><span>Только имя Артёма — этого достаточно.</span></button>
        <button type="button" class="directory-choice" data-evidence-choice="b" role="radio" aria-checked="false"><b>2</b><span>Переписку с именем отправителя, временем и адресом ссылки, не открывая её.</span></button>
        <button type="button" class="directory-choice" data-evidence-choice="c" role="radio" aria-checked="false"><b>3</b><span>Клиентский файл и скриншот переписки.</span></button>
      </div>
      <button class="evidence-check" type="button" data-action="check-evidence" disabled>Проверить решение</button>
      <div class="evidence-feedback" role="status" hidden></div>
      <button class="evidence-next" type="button" data-action="next" ${state.protection >= 3 ? '' : 'hidden'}>Продолжить</button>
      <button class="evidence-back" type="button" data-action="back-shadow">Вернуться к сцене</button>
    </div>`;
  }

  function reportScene() {
    return `<div class="evidence-panel">
      <p class="eyebrow">Глава 3 · Подать сигнал</p>
      <h2 id="scene-title">Кому сообщить?</h2>
      <p class="evidence-intro">«Артём»: «Не вздумай никому говорить. Я узнаю».</p>
      <p class="evidence-intro">Ника: «Нужно предупредить тех, кто сможет проверить подозрительный доступ».</p>
      <div class="evidence-options" role="radiogroup" aria-label="Кому отправить сообщение о случившемся?">
        <button type="button" class="directory-choice" data-evidence-choice="a" role="radio" aria-checked="false"><b>1</b><span>В службу информационной безопасности через контакт из корпоративного справочника.</span></button>
        <button type="button" class="directory-choice" data-evidence-choice="b" role="radio" aria-checked="false"><b>2</b><span>Только Марине и дождаться, пока она сама решит, что делать дальше.</span></button>
        <button type="button" class="directory-choice" data-evidence-choice="c" role="radio" aria-checked="false"><b>3</b><span>Всем сотрудникам в общий чат, приложив клиентский файл.</span></button>
      </div>
      <button class="evidence-check" type="button" data-action="check-evidence" disabled>Проверить решение</button>
      <div class="evidence-feedback" role="status" hidden></div>
      <button class="evidence-next" type="button" data-action="next" ${state.protection >= 4 ? '' : 'hidden'}>К рекомендациям</button>
      <button class="evidence-back" type="button" data-action="back-evidence">Вернуться к предыдущему заданию</button>
    </div>`;
  }

  function reportTheoryScene() {
    return `<div class="content content--theory"><div class="theory-panel report-theory">
      <p class="eyebrow">Глава 3 · Рекомендации</p>
      <h2 id="scene-title">Сохранить следы.<br>Подать сигнал.</h2>
      <div class="theory-rule"><p><strong>Сохраните переписку:</strong> имя отправителя, время, текст сообщения и адрес ссылки.</p><p><strong>Не открывайте ссылку</strong> и не отправляйте закрытые данные.</p><p><strong>Сообщите в службу безопасности</strong> через контакт из корпоративного справочника.</p><p><strong>Следуйте инструкциям</strong> и предупредите коллегу через известный вам канал.</p></div>
      <p class="theory-quote">Ника: «Переписка сохранена. Теперь я знаю, куда сообщить о подозрительном запросе».</p>
      ${button('Вернуться к рабочему столу', 'next')}
    </div></div>`;
  }

  function returnMapScene() {
    return `<div class="content"><div class="map-copy"><p class="eyebrow">Карта этажа</p><h2 id="scene-title">Возвращение</h2><p class="objective">Ника возвращается к своему рабочему столу.</p><button class="return-next primary-button" type="button" data-action="next" hidden>К рабочему столу</button>${button('К рекомендациям', 'back-theory', true)}</div></div><div class="map-return-stage"><div class="map-nika is-returning" role="img" aria-label="Ника идёт из архива через коридор и вход в кабинет к своему столу"><span class="map-nika__label">Ника</span><div class="nika-sprite" aria-hidden="true"><img src="assets/nika-map-sprites.png" alt=""></div></div></div>`;
  }

  function securityChatScene() {
    return `<div class="content content--chat"><div class="chat-stage"><div class="monitor-chat chat-shell security-chat" aria-label="Корпоративный чат со службой безопасности">
      <aside class="chat-sidebar"><div class="chat-sidebar__title">☰ &nbsp; Сообщения <span>⌕</span></div><div class="contact active"><div class="security-avatar">СБ</div><div class="contact__info"><strong>Служба безопасности</strong><span>Корпоративный контакт</span></div></div></aside>
      <div class="chat-main"><header class="chat-header"><div class="security-avatar">СБ</div><div class="chat-header__meta"><strong>Служба безопасности</strong><span>корпоративный контакт</span></div><span class="chat-header__menu" aria-hidden="true">⌕ &nbsp; ⋮</span></header>
        <div class="chat-body security-body"><div class="system-note">Сегодня</div>
          <div class="message security-message--out" data-security="sent" hidden><div class="message__meta"><span>Ника</span><time>21:58</time></div><p>С аккаунта Артёма меня попросили передать клиентский файл по ссылке. Я проверила через Марину: Артём не отправлял эту просьбу. Прикладываю переписку и адрес ссылки.</p><div class="security-attachment">📎 Переписка и адрес ссылки</div></div>
          <div class="typing" data-security="typing" hidden>Служба безопасности печатает<span>…</span></div>
          <div class="message" data-security="reply" hidden><div class="message__meta"><span>Служба безопасности</span><time>21:58</time></div><p>Сообщение получено. Мы проверим учётную запись и ссылку. Пожалуйста, не открывайте её и не отправляйте файл.</p></div>
          <div class="security-thought" data-security="thought" hidden>Ника: «Хорошо. Теперь можно дождаться ответа».</div></div>
        <div class="chat-composer" aria-hidden="true"><span>⊕</span><span>Сообщение...</span><span>☺ &nbsp; 🎙</span></div></div></div>
      <div class="chat-stage__action security-action" data-security="action" hidden>${button('К итогам смены', 'next')}</div>
    </div></div>`;
  }

  function finalSummaryScene() {
    const shadowResult = state.risk === 0
      ? 'В заданиях ты выбирала безопасные действия — Тень не набрала силу.'
      : state.risk === 1
        ? 'Тень усилилась на один уровень. Проверка и сообщение помогли защитить данные.'
        : 'Рискованные решения усилили Тень. Проверка и сообщение помогли защитить данные.';
    return `<div class="content content--theory"><div class="theory-panel final-summary">
      <p class="eyebrow">Последний онлайн · Итоги</p>
      <h2 id="scene-title">Ночная смена окончена</h2>
      <p class="final-summary__lead">Ника не отправила клиентский файл и сообщила о подозрительном запросе в службу безопасности.</p>
      <div class="theory-rule"><span>ЧТО ПОМОГЛО ЗАЩИТИТЬ ДАННЫЕ</span><p>Остановиться, когда её начали торопить.</p><p>Проверить просьбу через независимый контакт.</p><p>Сохранить переписку, не открывая ссылку.</p><p>Сообщить в службу безопасности.</p></div>
      <p class="final-summary__score">Защита: ${state.protection}/5 · Сила Тени: ${state.risk}/3</p>
      <p class="final-summary__shadow">${shadowResult}</p>
      ${button('Завершить смену', 'next')}
    </div></div>`;
  }

  function leavingScene() {
    return `<div class="leaving-action"><button class="primary-button leaving-next" type="button" data-action="next" hidden>Посмотреть сообщение</button>${button('К итогам смены', 'back-summary', true)}</div><audio id="message-notification" src="assets/message-notification.mp3" preload="auto"></audio>`;
  }

  function mashaFinalScene() {
    return `<h1 id="scene-title" class="sr-only">Сообщение от Маши Кузнецовой</h1>
      <p class="sr-only">Маша Кузнецова была в сети 8 месяцев назад. Привет. Ты ещё в офисе? Откроешь файл?</p>
      <div class="masha-stage"><div class="masha-typing" hidden>Маша печатает<span aria-hidden="true">…</span></div></div>
      <div class="masha-finish" hidden>${button('Завершить', 'next')}</div>
      <audio id="witch-laugh" src="assets/witch-laugh.mp3" preload="auto"></audio>`;
  }

  function authorScene() {
    return `<div class="author-layout"><div class="author-card">
      <div class="author-portrait"><img src="assets/author-portrait.jpg" alt="Иллюстрированный портрет Екатерины в ведьминском колпаке"></div>
      <div class="author-info"><p class="eyebrow">Последний онлайн</p><h1 id="scene-title">Об авторе</h1>
        <p class="author-credit">Курс разработан Прокопенко Екатериной при поддержке чата GPT.</p>
        <p class="author-invite">Подписывайтесь на канал</p>
        <div class="author-channel"><img src="assets/author-telegram-qr.png" alt="QR-код Telegram-канала PROCURS_V_TAPKAH"><a href="https://t.me/procurs_v_tapkah" target="_blank" rel="noopener noreferrer">@PROCURS_V_TAPKAH ↗</a></div>
        ${button('Пройти ещё раз', 'reset')}
      </div></div></div>`;
  }

  const templates = { 1:titleScene, 2:rulesScene, 3:timeScene, 4:nikaScene, 5:onlineScene, 6:messageScene, 7:decisionScene, 8:pauseScene, 9:protectionScene, 10:mapScene, 11:endScene, 12:chapterTwoScene, 13:verifyScene, 14:directoryScene, 15:callScene, 16:marinaScene, 17:verificationEndScene, 18:shadowDoorScene, 19:evidenceScene, 20:reportScene, 21:reportTheoryScene, 22:returnMapScene, 23:securityChatScene, 24:finalSummaryScene, 25:leavingScene, 26:mashaFinalScene, 27:authorScene };

  function render() {
    scene.querySelectorAll('audio').forEach(audio => audio.pause());
    ambient.volume = ambientVolume;
    const template = templates[state.scene] || templates[1];
    const classes = ['scene'];
    if (state.scene === 1) classes.push('scene--title');
    else if (state.scene === 2) classes.push('scene--rules');
    else if (state.scene === 3) classes.push('scene--time');
    else if (state.scene === 4) classes.push('scene--nika');
    else if (state.scene === 5 || state.scene === 6 || state.scene === 7) classes.push('scene--chat');
    else if (state.scene === 8) classes.push('scene--outcome');
    else if (state.scene === 9) classes.push('scene--theory');
    else if (state.scene === 10) classes.push('scene--map');
    else if (state.scene === 11) classes.push('scene--archive');
    else if (state.scene === 12 || state.scene === 13) classes.push('scene--archive', 'scene--chapter-two');
    else if (state.scene === 14) classes.push('scene--directory');
    else if (state.scene === 15) classes.push('scene--call');
    else if (state.scene === 16) classes.push('scene--marina');
    else if (state.scene === 17) classes.push('scene--verification-end');
    else if (state.scene === 18) classes.push('scene--shadow-door');
    else if (state.scene === 19 || state.scene === 20) classes.push('scene--shadow-door', 'scene--evidence');
    else if (state.scene === 21) classes.push('scene--report-theory');
    else if (state.scene === 22) classes.push('scene--map', 'scene--return-map');
    else if (state.scene === 23) classes.push('scene--chat', 'scene--security');
    else if (state.scene === 24) classes.push('scene--final-summary');
    else if (state.scene === 25) classes.push('scene--leaving');
    else if (state.scene === 26) classes.push('scene--masha-final');
    else if (state.scene === 27) classes.push('scene--author');
    else classes.push('scene--office');
    scene.className = classes.join(' ');
    const sceneBackgrounds = {
      1: "url('assets/office-exterior.jpg')",
      2: "url('assets/screen-02-rules.jpg')",
      3: "url('assets/screen-03-office.jpg')",
      4: "url('assets/screen-04-nika-chat.jpg')",
      5: "url('assets/nika-monitor-chat.jpg')",
      6: "url('assets/nika-monitor-chat.jpg')",
      7: "url('assets/nika-decision.jpg')",
      8: "url('assets/nika-outcome.jpg')",
      9: "url('assets/office-stop.jpg')",
      11: "url('assets/archive-interior.jpg')",
      12: "url('assets/archive-terminal.jpg')",
      13: "url('assets/archive-terminal.jpg')",
      14: "url('assets/archive-directory.jpg')",
      15: "url('assets/archive-directory.jpg')",
      16: "url('assets/archive-directory.jpg')",
      17: "url('assets/archive-directory.jpg')",
      18: "url('assets/archive-shadow-door.jpg')",
      19: "url('assets/archive-shadow-door.jpg')",
      20: "url('assets/archive-shadow-door.jpg')",
      21: "url('assets/archive-shadow-door.jpg')",
      23: "url('assets/nika-monitor-chat.jpg')",
      24: "url('assets/final-office.jpg')",
      25: "url('assets/nika-leaving.jpg')",
      26: "url('assets/masha-final.jpg')",
      27: "url('assets/final-office.jpg')"
    };
    scene.style.setProperty('--scene-bg', sceneBackgrounds[state.scene] || '');
    scene.innerHTML = template();
    scene.scrollTop = 0;
    scene.scrollLeft = 0;
    window.scrollTo(0, 0);
    updateHud();
    bindSceneActions();
    if (state.scene === 15) startCallSequence();
    if (state.scene === 16) startMarinaSequence();
    if (state.scene === 17) startDoorCreak();
    if (state.scene === 22) window.setTimeout(() => { if (state.scene === 22) { const next = scene.querySelector('.return-next'); if (next) next.hidden = false; } }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 7000);
    if (state.scene === 23) startSecuritySequence();
    if (state.scene === 25) startMessageNotification();
    if (state.scene === 26) startMashaFinal();
    const title = document.querySelector('#scene-title');
    if (title) {
      title.setAttribute('tabindex', '-1');
      title.focus({ preventScroll: true });
    }
  }

  function bindSceneActions() {
    scene.querySelectorAll('[data-action]').forEach(el => el.addEventListener('click', () => handleAction(el.dataset.action)));
    scene.querySelectorAll('[data-choice]').forEach(el => el.addEventListener('click', () => choose(el.dataset.choice)));
    scene.querySelectorAll('[data-verify-choice]').forEach(el => el.addEventListener('click', () => chooseVerify(el.dataset.verifyChoice)));
    scene.querySelectorAll('[data-call-choice]').forEach(el => el.addEventListener('click', () => chooseCall(el.dataset.callChoice)));
    scene.querySelectorAll('[data-evidence-choice]').forEach(el => el.addEventListener('click', () => {
      scene.querySelectorAll('[data-evidence-choice]').forEach(option => { const selected = option === el; option.classList.toggle('is-selected', selected); option.setAttribute('aria-checked', String(selected)); });
      scene.querySelector('.evidence-check').disabled = false;
      scene.querySelector('.evidence-feedback').hidden = true;
    }));
  }

  function handleAction(action) {
    tone();
    syncAmbient();
    if (action === 'next') setScene(state.scene + 1);
    if (action === 'retry-choice') setScene(7);
    if (action === 'resume') setScene(Math.max(2, state.scene));
    if (action === 'archive') walkToArchive();
    if (action === 'replay-call') startCallSequence();
    if (action === 'back-shadow') setScene(18);
    if (action === 'back-evidence') setScene(19);
    if (action === 'back-theory') setScene(21);
    if (action === 'back-map') setScene(22);
    if (action === 'back-security') setScene(23);
    if (action === 'back-summary') setScene(24);
    if (action === 'check-evidence') {
      const choice = scene.querySelector('[data-evidence-choice][aria-checked="true"]')?.dataset.evidenceChoice;
      const feedback = state.scene === 20 ? {a:'Верно. Сообщите в службу безопасности через корпоративный справочник и передайте сохранённую переписку.',b:'Марину можно предупредить, но не откладывайте обращение в службу безопасности.',c:'Не публикуйте клиентский файл в общем чате. Сообщите о запросе службе безопасности.'} : {a:'Одного имени недостаточно: сохраните также текст, время и адрес ссылки.',b:'Верно. Сохраните переписку, время и адрес ссылки, не открывая её. Клиентский файл отправлять не нужно.',c:'Клиентский файл содержит закрытые данные. Сохраните переписку, но не отправляйте сам файл.'};
      if (!feedback[choice]) return;
      const isWrong = state.scene === 19 ? choice !== 'b' : choice !== 'a';
      const grew = isWrong && strengthenShadow(state.scene === 19 ? 'evidence' : 'report');
      if (state.scene === 19 && choice === 'b') { state.protection = Math.max(state.protection, 3); saveState(); updateHud(); scene.querySelector('.evidence-next').hidden = false; }
      if (state.scene === 20 && choice === 'a') { state.protection = Math.max(state.protection, 4); saveState(); updateHud(); scene.querySelector('.evidence-next').hidden = false; }
      const explanation = feedback[choice] + (grew ? ' Сила Тени +1.' : '');
      const result = scene.querySelector('.evidence-feedback'); result.textContent = explanation; result.hidden = false; announce(explanation);
    }
    if (action === 'open-shadow-chat') {
      scene.classList.add('is-chat-focused');
      scene.querySelector('.shadow-back').hidden = false;
      scene.querySelector('.shadow-back').focus({ preventScroll: true });
    }
    if (action === 'close-shadow-chat') {
      scene.classList.remove('is-chat-focused');
      scene.querySelector('.shadow-back').hidden = true;
      scene.querySelector('.shadow-story .primary-button').focus({ preventScroll: true });
    }
    if (action === 'reset') {
      if (new URLSearchParams(window.location.search).has('preview')) window.history.replaceState(null, '', window.location.pathname);
      state = structuredClone(defaults);
      saveState();
      setScene(1);
    }
  }

  function walkToArchive() {
    const marker = scene.querySelector('.map-nika');
    const target = scene.querySelector('.map-hotspot');
    if (!marker || marker.classList.contains('is-walking')) return;
    marker.classList.add('is-walking');
    if (target) target.disabled = true;
    announce('Ника идёт по коридору к архиву.');
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 250 : 4800;
    window.setTimeout(() => setScene(11), duration);
  }

  function choose(choice) {
    tone(choice === 'c' ? 520 : 170, .12);
    if (choice === 'a') state.flags.openedLink = true;
    if (choice === 'b') state.flags.repliedInChat = true;
    if (choice === 'a' || choice === 'b') strengthenShadow('first');
    state.outcome = choice;
    if (choice === 'c') state.protection = Math.max(state.protection, 1);
    setScene(8);
  }

  function chooseVerify(choice) {
    tone(choice === 'b' ? 520 : 170, .12);
    if (choice === 'a') state.flags.calledMessageNumber = true;
    if (choice === 'c') state.flags.askedSameChatAgain = true;
    const grew = (choice === 'a' || choice === 'c') && strengthenShadow('verify');
    if (choice === 'b') state.protection = Math.max(state.protection, 2);
    state.verifyChoice = choice;
    saveState();
    render();
    if (grew) {
      const result = scene.querySelector('.directory-feedback');
      if (result) result.append(' Сила Тени +1.');
      announce('Рискованное решение. Сила Тени увеличилась на один уровень.');
    }
  }

  function startCallSequence() {
    const stage = scene.querySelector('.call-stage');
    const ringtone = scene.querySelector('#archive-ringtone');
    if (!stage || !ringtone) return;
    const id = ++callSequenceId;
    stage.classList.remove('is-dialed', 'is-calling', 'is-quote', 'is-choices');
    ringtone.pause();
    ringtone.currentTime = 0;
    ringtone.volume = 0;
    if (state.sound) ringtone.play().catch(() => {});
    const step = (delay, callback) => window.setTimeout(() => {
      if (id === callSequenceId && state.scene === 15) callback();
    }, delay);
    step(500, () => stage.classList.add('is-dialed'));
    step(1900, () => stage.classList.add('is-calling'));
    step(2200, () => {
      if (state.sound) {
        ambient.volume = .055;
        ringtone.currentTime = 0;
        ringtone.volume = .22;
        ringtone.play().catch(() => {});
      }
    });
    step(6200, () => { ringtone.pause(); ambient.volume = ambientVolume; stage.classList.add('is-quote'); announce('Ника: Телефон звонит в кабинете Б-24, но никто не отвечает.'); });
    step(8400, () => { stage.classList.add('is-choices'); announce('Что делать дальше? Выберите один из трёх вариантов.'); });
  }

  function chooseCall(choice) {
    if (!['a', 'b', 'c'].includes(choice)) return;
    tone(choice === 'b' ? 520 : 170, .12);
    if (choice === 'a') state.flags.sentFileAfterCall = true;
    if (choice === 'c') state.flags.calledChatNumber = true;
    const grew = (choice === 'a' || choice === 'c') && strengthenShadow('call');
    state.callChoice = choice;
    saveState();
    updateHud();
    scene.querySelectorAll('[data-call-choice]').forEach(el => el.classList.toggle('is-selected', el.dataset.callChoice === choice));
    const feedback = {
      a: 'Файл остаётся закрытым: отправлять его до подтверждения личности нельзя.',
      b: 'Верно. Если Артём не отвечает, свяжитесь с Мариной по контакту из корпоративного справочника.',
      c: 'Номер из подозрительного чата не является независимым источником. Его мог указать мошенник.'
    };
    scene.querySelector('.call-feedback').textContent = feedback[choice] + (grew ? ' Сила Тени +1.' : '');
    scene.querySelector('.call-feedback').classList.add('is-visible');
    scene.querySelector('.call-next').classList.toggle('is-visible', choice === 'b');
    announce(feedback[choice] + (grew ? ' Сила Тени увеличилась на один уровень.' : ''));
  }

  function startMarinaSequence() {
    const chat = scene.querySelector('.marina-chat');
    if (!chat) return;
    const id = ++marinaSequenceId;
    const reveal = (delay, stepName, spoken) => window.setTimeout(() => {
      if (id !== marinaSequenceId || state.scene !== 16) return;
      if (stepName === 'answer') chat.querySelector('[data-marina-step="typing"]').classList.remove('is-visible');
      const element = chat.querySelector(`[data-marina-step="${stepName}"]`);
      element.classList.add('is-visible');
      const body = chat.querySelector('.marina-chat__body');
      body.scrollTo({ top:body.scrollHeight, behavior:'smooth' });
      if (stepName === 'first' || stepName === 'answer') tone(500, .07);
      if (spoken) announce(spoken);
    }, delay);
    reveal(450, 'nika', 'Ника пишет Марине о подозрительной просьбе.');
    reveal(1800, 'first', 'Марина уточнит информацию у Артёма по личному номеру.');
    reveal(5000, 'typing', 'Марина печатает.');
    reveal(7300, 'answer', 'Артём не отправлял ссылку и не просил клиентский файл. Ничего не отправляйте.');
    reveal(9600, 'thought', 'Ника сохранит переписку и сообщит о подозрительном запросе.');
    window.setTimeout(() => {
      if (id === marinaSequenceId && state.scene === 16) chat.parentElement.querySelector('.marina-next').classList.add('is-visible');
    }, 10200);
  }

  function startSecuritySequence() {
    const id = ++securitySequenceId;
    const reveal = (delay, name, text) => window.setTimeout(() => {
      if (state.scene !== 23 || id !== securitySequenceId) return;
      const el = scene.querySelector(`[data-security="${name}"]`);
      if (!el) return;
      if (name === 'reply') { scene.querySelector('[data-security="typing"]').hidden = true; tone(500, .07); }
      if (name === 'sent') { state.protection = Math.max(state.protection, 5); saveState(); updateHud(); }
      el.hidden = false;
      const body = scene.querySelector('.security-body');
      body.scrollTop = body.scrollHeight;
      if (text) announce(text);
    }, delay);
    reveal(500, 'sent', 'Ника отправила переписку в службу безопасности.');
    reveal(1900, 'typing', 'Служба безопасности печатает.');
    reveal(4100, 'reply', 'Служба безопасности получила сообщение и проверит запрос.');
    reveal(5400, 'thought', 'Ника: Хорошо. Теперь можно дождаться ответа.');
    reveal(5600, 'action');
  }

  function startMessageNotification() {
    const audio = scene.querySelector('#message-notification');
    if (!audio) return;
    audio.volume = .65;
    audio.addEventListener('ended', () => { ambient.volume = ambientVolume; const next = scene.querySelector('.leaving-next'); if (state.scene === 25 && next) next.hidden = false; });
    audio.addEventListener('error', () => { ambient.volume = ambientVolume; });
    window.setTimeout(() => {
      if (state.scene !== 25 || !state.sound || !scene.contains(audio)) return;
      ambient.volume = .055;
      audio.play().then(() => announce('Звук уведомления')).catch(() => { ambient.volume = ambientVolume; });
    }, 900);
    window.setTimeout(() => { if (state.scene === 25 && scene.contains(audio)) scene.querySelector('.leaving-next').hidden = false; }, 6500);
  }

  function startMashaFinal() {
    const typing = scene.querySelector('.masha-typing');
    const finish = scene.querySelector('.masha-finish');
    const laugh = scene.querySelector('#witch-laugh');
    laugh.volume = .38 + .1 * state.risk;
    laugh.addEventListener('ended', () => { ambient.volume = ambientVolume; });
    laugh.addEventListener('error', () => { ambient.volume = ambientVolume; });
    window.setTimeout(() => { if (state.scene === 26 && scene.contains(typing)) { typing.hidden = false; announce('Маша печатает.'); if (state.sound) { ambient.volume = .055; laugh.play().catch(() => { ambient.volume = ambientVolume; }); } } }, 1800);
    window.setTimeout(() => { if (state.scene === 26 && scene.contains(finish)) finish.hidden = false; }, 5200);
  }

  function startDoorCreak() {
    const audio = scene.querySelector('#archive-door-creak');
    if (!audio) return;
    audio.volume = .42;
    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime >= 7.5) { audio.pause(); audio.currentTime = 0; ambient.volume = ambientVolume; }
    });
    if (state.sound) { ambient.volume = .055; audio.play().catch(() => { ambient.volume = ambientVolume; }); }
  }

  document.querySelector('#sound-toggle').addEventListener('click', () => {
    setSound(!state.sound);
  });

  document.addEventListener('click', syncAmbient);

  document.querySelector('#fullscreen-toggle').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  });

  document.addEventListener('keydown', event => {
    if (state.scene === 7 && ['1','2','3'].includes(event.key)) choose({ '1':'a', '2':'b', '3':'c' }[event.key]);
    if (state.scene === 14 && ['1','2','3'].includes(event.key)) chooseVerify({ '1':'a', '2':'b', '3':'c' }[event.key]);
    if (state.scene === 15 && scene.querySelector('.call-stage.is-choices') && ['1','2','3'].includes(event.key)) chooseCall({ '1':'a', '2':'b', '3':'c' }[event.key]);
    if (event.key.toLowerCase() === 'm') {
      setSound(!state.sound);
    }
    else if (state.sound) syncAmbient();
  });

  render();
})();

