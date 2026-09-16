// netlify/functions/chat.js
//
// Endpoint: /.netlify/functions/chat
// Chatbot de perguntas e respostas sobre golpes digitais, fake news e
// segurança online. Conversa livre (não força JSON como o /verificar),
// mas mantém a mesma postura educativa e sem certezas absolutas.
//
// Usa a mesma chave MISTRAL_API_KEY já configurada na Netlify.

const MODEL = process.env.MISTRAL_CHAT_MODEL || process.env.MISTRAL_MODEL || "mistral-small-latest";
const MAX_MENSAGENS_HISTORICO = 12; // últimas N mensagens (usuário + assistente)
const MAX_CHARS_POR_MENSAGEM = 1200;
const MAX_CHARS_TOTAL = 8000;

const PROMPT_SISTEMA = `Você é o assistente virtual de um site educativo de extensão universitária (EJA) sobre golpes digitais e fake news.

COMO SE COMPORTAR:
- Responda em português do Brasil, de forma simples, curta e direta — o público é adulto que está aprendendo sobre segurança digital, evite jargão técnico.
- Ajude a esclarecer dúvidas sobre golpes (Pix, WhatsApp, phishing, falso familiar, falsa promoção etc.), fake news e boas práticas de segurança online.
- Reforce sempre que fizer sentido o método PARE, PENSE e CONFIRME.
- NUNCA afirme com certeza absoluta que algo é "fake" ou "verdadeiro", nem que uma imagem é "real" ou "falsa". Você não tem como verificar fatos em tempo real. Fale em termos de sinais de alerta e oriente a pessoa a checar em fontes oficiais ou agências de checagem (Aos Fatos, Lupa, Fato ou Fake).
- Se a pessoa colar uma mensagem suspeita, aponte os sinais de golpe/desinformação nela, sem dar veredito binário.
- Se perguntarem algo fora do tema do site (ex: receitas, futebol, assuntos pessoais), responda educadamente que seu foco é ajudar com segurança digital, golpes e fake news, e sugira usar a seção "Verificador com IA" do site para analisar textos, links ou prints.
- Nunca peça dados pessoais, senhas ou códigos do usuário.
- Respostas curtas (poucos parágrafos). Isso é um chat, não um artigo.`;

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return resposta(405, { erro: "Método não permitido." }, headers);
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return resposta(
      500,
      { erro: "Servidor não configurado. Falta MISTRAL_API_KEY nas variáveis de ambiente da Netlify." },
      headers
    );
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resposta(400, { erro: "JSON inválido no corpo da requisição." }, headers);
  }

  const mensagensRecebidas = Array.isArray(body.mensagens) ? body.mensagens : [];

  if (!mensagensRecebidas.length) {
    return resposta(400, { erro: "Envie ao menos uma mensagem." }, headers);
  }

  // Sanitiza e limita o histórico recebido do cliente
  const historico = mensagensRecebidas
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_MENSAGENS_HISTORICO)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_CHARS_POR_MENSAGEM),
    }));

  if (!historico.length) {
    return resposta(400, { erro: "Nenhuma mensagem válida recebida." }, headers);
  }

  const totalChars = historico.reduce((soma, m) => soma + m.content.length, 0);
  if (totalChars > MAX_CHARS_TOTAL) {
    return resposta(413, { erro: "Conversa muito longa. Recarregue o chat e comece de novo." }, headers);
  }

  try {
    const respostaMistral = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 500,
        messages: [{ role: "system", content: PROMPT_SISTEMA }, ...historico],
      }),
    });

    if (!respostaMistral.ok) {
      const detalhe = await respostaMistral.text();
      console.error("Erro Mistral (chat):", respostaMistral.status, detalhe);
      return resposta(
        502,
        {
          erro:
            respostaMistral.status === 429
              ? "Limite gratuito da IA atingido no momento. Tente novamente em alguns minutos."
              : "Não foi possível responder agora. Tente novamente.",
        },
        headers
      );
    }

    const dados = await respostaMistral.json();
    const textoResposta = dados?.choices?.[0]?.message?.content || null;

    if (!textoResposta) {
      return resposta(502, { erro: "A IA não retornou uma resposta válida." }, headers);
    }

    return resposta(200, { resposta: textoResposta }, headers);
  } catch (e) {
    console.error("Erro inesperado (chat):", e);
    return resposta(500, { erro: "Erro inesperado no servidor." }, headers);
  }
};

function resposta(statusCode, dataObj, headers) {
  return { statusCode, headers, body: JSON.stringify(dataObj) };
}
