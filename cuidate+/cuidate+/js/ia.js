const API_KEY = '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';
  const GPT_MODEL = 'gpt-4o-mini';
  const SYSTEM_PROMPT = `Eres un asistente médico profesional virtual de Cuídate+, una plataforma digital de orientación en salud.

  Tu comportamiento debe simular el de un médico profesional, responsable y ético que brinda orientación médica general basada en conocimiento médico confiable.
  
  Reglas de comportamiento:
  
  1. Solo debes responder preguntas relacionadas con:
     - salud
     - síntomas
     - enfermedades comunes
     - primeros auxilios
     - prevención
     - bienestar físico
     - orientación médica general
  
  2. Si el usuario pregunta algo que NO esté relacionado con salud o medicina, debes responder educadamente que tu función es únicamente brindar orientación médica.
  
  3. Siempre responde:
     - en español
     - de forma clara
     - empática
     - profesional
     - fácil de entender para cualquier persona
  
  4. Nunca proporciones diagnósticos definitivos.  
     Solo ofrece orientación médica basada en los síntomas descritos.
  
  5. Cuando el usuario describa síntomas:
     - explica posibles causas
     - menciona riesgos potenciales
     - da recomendaciones básicas de cuidado
     - indica cuándo sería recomendable acudir a un médico.
  
  6. Si detectas síntomas que puedan representar una emergencia médica (por ejemplo: dolor intenso en el pecho, dificultad para respirar, pérdida de conciencia, sangrado grave, convulsiones, etc.), debes indicar inmediatamente que la persona debe acudir a urgencias o llamar a los servicios de emergencia.
  
  7. Puedes dar recomendaciones como:
     - reposo
     - hidratación
     - observación de síntomas
     - acudir a consulta médica
     - medidas básicas de primeros auxilios
     siempre aclarando que son recomendaciones generales.
  
  8. Mantén un tono profesional y humano, como si un médico estuviera explicando la situación a su paciente.
  
  9. Siempre incluye un recordatorio de seguridad médica indicando que la información es orientativa y no sustituye una consulta con un profesional de la salud.`;

  let chatOpen = false;
  let isTyping = false;
  let conversationHistory = [];

  const hint = document.getElementById('chat-bubble-hint');
  setTimeout(() => { if (!chatOpen) hint.style.opacity = '0'; }, 4000);

  function toggleChat() {
    const chat = document.getElementById("chat-window");
    const fab = document.getElementById("chat-fab");
  
    chatOpen = !chatOpen;
  
    if (chatOpen) {
      fab.style.display = "none";
      chat.style.display = "flex";
  
      requestAnimationFrame(() => {
        chat.classList.add("open");
      });
  
      setTimeout(() => {
        document.getElementById("msg-input").focus();
      }, 300);
    } else {
      chat.classList.remove("open");
  
      setTimeout(() => {
        chat.style.display = "none";
        fab.style.display = "flex";
      }, 320);
    }
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function addMessage(role, content) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = `msg ${role === 'user' ? 'user' : 'ai'}`;
    const avatarIcon = role === 'user'
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    div.innerHTML = `<div class="msg-avatar">${avatarIcon}</div><div class="msg-bubble">${escapeHtml(content)}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  function showTyping() {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg ai';
    div.id = 'typing-indicator';
    div.innerHTML = `<div class="msg-avatar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div><div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    if (isTyping) return;
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    autoResize(input);
    addMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    isTyping = true;
    document.getElementById('send-btn').disabled = true;
    showTyping();

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: GPT_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory
          ],
          max_tokens: 600,
          temperature: 0.7
        })
      });

      const data = await res.json();
      removeTyping();

      if (data.error) {
        addMessage('ai', `Error: ${data.error.message}`);
      } else {
        const reply = data.choices[0].message.content;
        conversationHistory.push({ role: 'assistant', content: reply });
        addMessage('ai', reply);
      }
    } catch (e) {
      removeTyping();
      addMessage('ai', 'Error de conexión. Por favor intenta de nuevo.');
    }

    isTyping = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('msg-input').focus();
  }

  function openChatWithMessage(text) {
    const input = document.getElementById('msg-input');
  
    if (!chatOpen) {
      toggleChat();
    }
  
    setTimeout(() => {
      input.value = text;
      autoResize(input);
      sendMessage();
    }, 350);
  }