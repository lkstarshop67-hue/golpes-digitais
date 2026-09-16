# Verificador com IA — Guia de configuração

Este site tem uma seção "Verificador com IA" (`#verificador`) que analisa
texto, link ou imagem em busca de **sinais** de golpe/fake news. Ela usa a
API gratuita da **Mistral AI** por trás de uma função serverless da Netlify
(pra não expor sua chave de API no navegador).

**Importante:** a ferramenta não certifica fatos nem imagens com 100% de
certeza — nenhuma IA consegue isso. Ela aponta sinais de risco e orienta a
checagem, alinhado com o método "PARE, PENSE, CONFIRME" do resto do site.

---

## Passo 1 — Conseguir uma chave gratuita da Mistral

1. Acesse **https://console.mistral.ai/** e crie uma conta (só pede e-mail,
   sem cartão de crédito no plano gratuito "Experiment").
2. No painel, vá em **API Keys** e crie uma nova chave.
3. Guarde essa chave — você vai colar ela na Netlify no Passo 3.

> O modelo padrão usado aqui é `mistral-small-latest`, que tem suporte a
> texto e imagem no plano gratuito. Os limites exatos (requisições por
> minuto/mês) mudam de tempos em tempos — confira o valor atual em
> https://docs.mistral.ai antes de divulgar o site pra muita gente.

## Passo 2 — Publicar o site na Netlify

1. Crie uma conta grátis em **https://www.netlify.com/**.
2. Envie esta pasta (com `index.html`, `style.css`, `script.js`,
   `netlify.toml` e a pasta `netlify/functions/`) para um repositório no
   GitHub, **ou** arraste a pasta direto no painel da Netlify
   ("Deploys" → "Deploy manually").
3. A Netlify detecta o `netlify.toml` automaticamente e publica tanto o
   site quanto a função.

## Passo 3 — Configurar a variável de ambiente

1. No painel da Netlify, vá em **Site settings → Environment variables**.
2. Adicione:
   - `MISTRAL_API_KEY` = a chave que você gerou no Passo 1.
3. Se quiser trocar o modelo no futuro, adicione também (opcional):
   - `MISTRAL_MODEL` = nome do modelo (por padrão usa `mistral-small-latest`;
     se quiser mais qualidade de análise de imagem, pode testar
     `pixtral-large-latest`, mas confira se ainda está no plano gratuito).
4. Publique de novo o site (Deploy → Trigger deploy) para a variável entrar
   em vigor.

## Passo 4 — Testar

1. Abra o site publicado, vá até a seção "Verificador com IA".
2. Cole um texto de exemplo (ex.: uma das mensagens de golpe já usadas nos
   cards do site) e clique em "Analisar com IA".
3. Se aparecer erro "Servidor não configurado", confira se o nome da
   variável está exatamente `MISTRAL_API_KEY` e se você publicou de novo
   depois de salvá-la.

## Testando no seu computador (opcional, pra quem for mexer no código)

```bash
npm install -g netlify-cli
netlify dev
```

Isso sobe o site localmente com a função serverless funcionando (lembre de
criar um arquivo `.env` com `MISTRAL_API_KEY=sua_chave` na raiz do projeto,
e não subir esse arquivo pro GitHub).

## Chatbot flutuante

Além do Verificador, o site tem um **assistente de chat flutuante** (bolinha
💬 no canto inferior direito, disponível em qualquer página/seção). Ele usa
a mesma `MISTRAL_API_KEY` e a função `netlify/functions/chat.js` — não
precisa de configuração extra além da que você já fez acima.

Diferença entre os dois:
- **Verificador** (`#verificador`): você cola texto/link/imagem e recebe uma
  análise estruturada (nível de risco, sinais, recomendações).
- **Chatbot** (bolinha flutuante): conversa livre, pra tirar dúvidas soltas
  ("recebi isso, é golpe?", "como faço uma busca reversa de imagem?" etc.).

O histórico da conversa do chat fica só na memória do navegador — some se a
pessoa recarregar a página. Isso é intencional pra simplicidade e
privacidade; dá pra evoluir depois com `localStorage` se quiser manter entre
sessões.

## Limites e cuidados

- **Uso indevido:** como o endpoint é público, qualquer pessoa que ache a
  URL da função pode chamá-la. Para um projeto de extensão isso raramente é
  um problema, mas se o tráfego crescer muito, considere adicionar um
  limite de requisições (a própria Netlify tem opções de rate limiting nos
  planos pagos, ou dá pra implementar um limite simples por IP).
- **Tamanho de imagem:** o site já redimensiona a imagem no navegador antes
  de enviar (máx. ~1024px), então a maioria dos prints funciona bem.
- **Links bloqueados:** alguns sites bloqueiam acessos automatizados. Nesse
  caso, a IA analisa só a URL e avisa que não conseguiu ler o conteúdo.
- **Trocar de provedor depois:** se um dia quiser voltar pro Gemini ou
  testar outro (Groq, OpenRouter etc.), só a função
  `netlify/functions/verificar.js` precisa mudar — o restante do site
  (HTML/CSS/JS) não depende do provedor escolhido.
