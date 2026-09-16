// netlify/functions/verificar.js
//
// Endpoint: /.netlify/functions/verificar
// Recebe { texto, link, imagemBase64, imagemMimeType } e devolve uma análise
// de sinais de risco (NUNCA um veredito binário de "fake" ou "verdadeiro").
//
// Provedor de IA: Mistral AI (console.mistral.ai) — plano gratuito "Experiment",
// sem cartão de crédito, com modelo com suporte a imagem.
// A chave da API fica em uma variável de ambiente (MISTRAL_API_KEY) configurada
// no painel da Netlify — nunca aparece no código que vai para o navegador.

const MODEL = process.env.MISTRAL_MODEL || "mistral-small-latest";
const MAX_TEXT_CHARS = 6000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // ~4MB depois de base64 -> ~3MB de imagem real
const FETCH_TIMEOUT_MS = 8000;

const PROMPT_SISTEMA = `Você é um assistente educativo de checagem de informações para um site de extensão universitária que ensina adultos (público EJA) a reconhecer golpes digitais e fake news.

REGRAS IMPORTANTES:
- NUNCA declare algo como "fake" ou "verdadeiro" com certeza absoluta. Você não tem capacidade de verificar fatos em tempo real nem de certificar autenticidade de imagens.
- Sua função é apontar SINAIS de risco (linguísticos, estruturais, contextuais) e orientar sobre como o usuário pode checar por conta própria.
- Para imagens: você pode comentar sobre inconsistências visuais aparentes (bordas estranhas, iluminação, tipografia, contexto), mas deixe claro que isso não substitui uma busca reversa de imagem.
- Para links: baseie-se apenas no conteúdo textual fornecido, nunca invente informações sobre o site.
- Seja didático, direto e em português do Brasil.
- Responda ESTRITAMENTE em JSON válido, sem markdown, sem texto fora do JSON, no formato:

{
  "nivel_risco": "baixo" | "medio" | "alto",
  "resumo": "1-2 frases resumindo a avaliação",
  "sinais_encontrados": ["sinal 1", "sinal 2", ...],
  "sinais_positivos": ["o que parece confiável, se houver"],
  "recomendacoes": ["passo prático 1", "passo prático 2", ...],
  "aviso": "lembrete curto de que isso é apoio educativo, não verificação definitiva"
}`;

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

  const texto = (body.texto || "").toString().slice(0, MAX_TEXT_CHARS);
  const link = (body.link || "").toString().trim();
  const imagemBase64 = body.imagemBase64 || null;
  const imagemMimeType = body.imagemMimeType || "image/jpeg";

  if (!texto && !link && !imagemBase64) {
    return resposta(
      400,
      { erro: "Envie pelo menos um texto, link ou imagem para analisar." },
      headers
    );
  }

  if (imagemBase64 && Buffer.byteLength(imagemBase64, "base64") > MAX_IMAGE_BYTES) {
    return resposta(413, { erro: "Imagem muito grande. Envie um arquivo menor." }, headers);
  }

  // 1) Se veio um link, busca o conteúdo da página no servidor (evita CORS)
  let conteudoLink = "";
  let erroLink = null;
  if (link) {
    try {
      conteudoLink = await buscarConteudoDaPagina(link);
    } catch (e) {
      erroLink = e.message || "Não foi possível acessar o link.";
    }
  }

  // 2) Monta as partes da requisição pro Mistral
  const partesUsuario = [];
  let contextoTextual = "";

  if (texto) {
    contextoTextual += `TEXTO ENVIADO PELO USUÁRIO:\n"""${texto}"""\n\n`;
  }
  if (link) {
    contextoTextual += `LINK ANALISADO: ${link}\n`;
    if (conteudoLink) {
      contextoTextual += `CONTEÚDO EXTRAÍDO DA PÁGINA (pode estar incompleto):\n"""${conteudoLink}"""\n\n`;
    } else {
      contextoTextual += `(Não foi possível extrair o conteúdo da página automaticamente${
        erroLink ? ": " + erroLink : ""
      }. Avalie apenas com base na URL e nos sinais que ela sugere, e recomende checagem manual.)\n\n`;
    }
  }
  if (!texto && !link) {
    contextoTextual += "O usuário enviou apenas uma imagem/print para análise.\n\n";
  }

  partesUsuario.push({ type: "text", text: contextoTextual });

  if (imagemBase64) {
    partesUsuario.push({
      type: "image_url",
      image_url: `data:${imagemMimeType};base64,${imagemBase64}`,
    });
  }

  // 3) Chama a API do Mistral
  try {
    const respostaMistral = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROMPT_SISTEMA },
          { role: "user", content: partesUsuario },
        ],
      }),
    });

    if (!respostaMistral.ok) {
      const detalhe = await respostaMistral.text();
      console.error("Erro Mistral:", respostaMistral.status, detalhe);
      return resposta(
        502,
        {
          erro:
            respostaMistral.status === 429
              ? "Limite gratuito da IA atingido no momento. Tente novamente em alguns minutos."
              : "Não foi possível concluir a análise agora. Tente novamente.",
        },
        headers
      );
    }

    const dados = await respostaMistral.json();
    const textoResposta = dados?.choices?.[0]?.message?.content || null;

    if (!textoResposta) {
      return resposta(502, { erro: "A IA não retornou uma análise válida." }, headers);
    }

    let analise;
    try {
      analise = JSON.parse(textoResposta);
    } catch {
      return resposta(502, { erro: "Resposta da IA em formato inesperado." }, headers);
    }

    return resposta(200, { analise }, headers);
  } catch (e) {
    console.error("Erro inesperado:", e);
    return resposta(500, { erro: "Erro inesperado no servidor." }, headers);
  }
};

function resposta(statusCode, dataObj, headers) {
  return { statusCode, headers, body: JSON.stringify(dataObj) };
}

async function buscarConteudoDaPagina(url) {
  let urlValida;
  try {
    urlValida = new URL(url);
    if (!["http:", "https:"].includes(urlValida.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error("URL inválida.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const resp = await fetch(urlValida.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VerificadorEducativoBot/1.0; +projeto-extensao-eja)",
      },
    });

    if (!resp.ok) {
      throw new Error(`A página respondeu com status ${resp.status}.`);
    }

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error("O link não aponta para uma página HTML.");
    }

    const html = await resp.text();
    return extrairTextoVisivel(html).slice(0, MAX_TEXT_CHARS);
  } finally {
    clearTimeout(timeout);
  }
}

// Extração simples de texto visível (sem dependências externas).
function extrairTextoVisivel(html) {
  let semScriptsEstilos = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const tituloMatch = semScriptsEstilos.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titulo = tituloMatch ? limparTags(tituloMatch[1]).trim() : "";

  const descMatch = semScriptsEstilos.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const descricao = descMatch ? descMatch[1].trim() : "";

  const textoBody = limparTags(semScriptsEstilos)
    .replace(/\s+/g, " ")
    .trim();

  return [
    titulo && `Título: ${titulo}`,
    descricao && `Descrição: ${descricao}`,
    `Conteúdo: ${textoBody}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function limparTags(str) {
  return str.replace(/<[^>]+>/g, " ");
}
