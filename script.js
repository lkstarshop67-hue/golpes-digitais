/* =========================
   MENU MOBILE
========================== */

function initMenu() {
    const toggle = document.getElementById("menuToggle");
    const links = document.getElementById("navLinks");

    if (!toggle || !links) return;

    toggle.addEventListener("click", () => {
        const aberto = links.classList.toggle("aberto");
        toggle.setAttribute("aria-expanded", aberto ? "true" : "false");
    });

    links.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            links.classList.remove("aberto");
            toggle.setAttribute("aria-expanded", "false");
        });
    });
}

/* =========================
   SIMULAÇÃO DE GOLPE NO WHATSAPP
========================== */

function initSimulacao() {
    const alerta = document.getElementById("alertaGolpe");
    const linkSuspeito = document.getElementById("linkSuspeito");
    const fecharBtn = document.getElementById("fecharAlerta");

    if (!alerta || !linkSuspeito || !fecharBtn) return;

    linkSuspeito.addEventListener("click", () => {
        alerta.classList.add("visivel");
        fecharBtn.focus();
    });

    fecharBtn.addEventListener("click", () => {
        alerta.classList.remove("visivel");
        linkSuspeito.focus();
    });
}

/* =========================
   CARDS EXPANSÍVEIS (exemplos reais de golpe)
========================== */

function initCardsExpansiveis() {
    const botoes = document.querySelectorAll(".card-toggle");

    botoes.forEach((botao) => {
        botao.addEventListener("click", () => {
            const alvo = document.getElementById(botao.getAttribute("aria-controls"));
            if (!alvo) return;

            const aberto = alvo.classList.toggle("aberto");
            botao.setAttribute("aria-expanded", aberto ? "true" : "false");
            botao.querySelector(".texto-toggle").textContent = aberto
                ? "Ocultar exemplo"
                : "Ver exemplo real";
        });
    });
}

/* =========================
   CONTADORES ANIMADOS (estatísticas)
========================== */

function animarContador(elemento) {
    const alvo = Number(elemento.dataset.alvo);
    const sufixo = elemento.dataset.sufixo || "";
    const duracao = 1400;
    const inicio = performance.now();

    function passo(agora) {
        const progresso = Math.min((agora - inicio) / duracao, 1);
        const valorAtual = Math.floor(progresso * alvo);
        elemento.textContent = valorAtual + sufixo;

        if (progresso < 1) {
            requestAnimationFrame(passo);
        } else {
            elemento.textContent = alvo + sufixo;
        }
    }

    requestAnimationFrame(passo);
}

function initContadores() {
    const stats = document.querySelectorAll(".stat-num[data-alvo]");
    if (!stats.length) return;

    if (!("IntersectionObserver" in window)) {
        stats.forEach(animarContador);
        return;
    }

    const observer = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                animarContador(entrada.target);
                observer.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach((stat) => observer.observe(stat));
}

/* =========================
   REVELAÇÃO DE SEÇÕES AO ROLAR
========================== */

function initReveal() {
    const alvos = document.querySelectorAll(".reveal");
    if (!alvos.length) return;

    if (!("IntersectionObserver" in window)) {
        alvos.forEach((el) => el.classList.add("visivel"));
        return;
    }

    const observer = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visivel");
                observer.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15 });

    alvos.forEach((el) => observer.observe(el));
}

/* =========================
   QUIZ: PERGUNTAS, RESPOSTAS E EXPLICAÇÕES
========================== */

// value "1" é sempre a alternativa correta de cada pergunta.
const perguntasQuiz = [
    {
        nome: "q1",
        titulo: "Mensagem urgente sobre bloqueio de conta",
        explicacao: "Mensagens que criam urgência (\"agora\", \"vai bloquear\") são uma tática clássica para impedir que você pare e pense. O caminho seguro é acessar o site ou app oficial diretamente, sem clicar em links recebidos."
    },
    {
        nome: "q2",
        titulo: "Pedido de código recebido por SMS",
        explicacao: "O código de verificação por SMS serve para confirmar que é você quem está entrando na conta. Nenhuma empresa ou suporte legítimo precisa desse código — pedir isso é sempre sinal de golpe."
    },
    {
        nome: "q3",
        titulo: "Cuidados antes de um Pix",
        explicacao: "Conferir nome, valor, instituição e motivo evita o golpe mais comum do Pix: a pressa. Depois de enviado, o dinheiro é muito difícil de recuperar."
    },
    {
        nome: "q4",
        titulo: "Notícia chocante sem fonte em grupo de WhatsApp",
        explicacao: "Uma notícia sem fonte identificada, sem data e que só circula em grupos de mensagem (sem aparecer em nenhum veículo de imprensa) é um forte sinal de desinformação. O tanto que ela circula não prova que seja verdadeira."
    },
    {
        nome: "q5",
        titulo: "Sinais visuais de fake news",
        explicacao: "Textos com excesso de letras maiúsculas, muitas exclamações e pedidos para \"compartilhar urgente\" tentam gerar reação emocional em vez de informar — um dos sinais mais comuns de fake news."
    }
];

function initQuiz() {
    const botao = document.getElementById("btnCorrigir");
    const btnReiniciar = document.getElementById("btnTentarNovamente");
    if (!botao) return;

    atualizarProgresso();

    // Realce visual da opção escolhida + atualização da barra de progresso,
    // sem revelar a explicação ainda (isso só acontece no resultado final).
    perguntasQuiz.forEach((p) => {
        const inputs = document.querySelectorAll(`input[name="${p.nome}"]`);

        inputs.forEach((input) => {
            input.addEventListener("change", () => {
                inputs.forEach((i) => {
                    i.closest(".option").classList.toggle("selecionada", i.checked);
                });
                atualizarProgresso();
            });
        });
    });

    botao.addEventListener("click", corrigirQuiz);

    if (btnReiniciar) {
        btnReiniciar.addEventListener("click", reiniciarQuiz);
    }
}

function contarRespondidas() {
    return perguntasQuiz.filter((p) =>
        document.querySelector(`input[name="${p.nome}"]:checked`)
    ).length;
}

function atualizarProgresso() {
    const total = perguntasQuiz.length;
    const respondidas = contarRespondidas();
    const texto = document.getElementById("quizProgressoTexto");
    const barra = document.getElementById("quizProgressoBarra");

    if (texto) {
        texto.textContent = respondidas === total
            ? `Todas as ${total} perguntas respondidas — clique em "Ver resultado"`
            : `${respondidas} de ${total} perguntas respondidas`;
    }

    if (barra) {
        barra.style.width = `${(respondidas / total) * 100}%`;
    }
}

function corrigirQuiz() {
    const total = perguntasQuiz.length;
    const respondidas = contarRespondidas();
    const resultado = document.getElementById("result");
    const review = document.getElementById("review");

    if (!resultado || !review) return;

    if (respondidas < total) {
        resultado.className = "result mid visivel";
        resultado.textContent = `Responda todas as ${total} perguntas antes de conferir o resultado. Faltam ${total - respondidas}.`;
        review.classList.remove("visivel");
        review.innerHTML = "";
        resultado.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    let pontos = 0;
    const linhasRevisao = [];

    perguntasQuiz.forEach((p, indice) => {
        const escolha = document.querySelector(`input[name="${p.nome}"]:checked`);
        const acertou = Number(escolha.value) === 1;

        if (acertou) {
            pontos++;
            linhasRevisao.push(`
                <div class="review-item certo">
                    <div class="review-icon">✅</div>
                    <div class="review-content">
                        <h4>${indice + 1}. ${p.titulo}</h4>
                        <p>Você acertou. ${p.explicacao}</p>
                    </div>
                </div>
            `);
        } else {
            linhasRevisao.push(`
                <div class="review-item errado">
                    <div class="review-icon">❌</div>
                    <div class="review-content">
                        <h4>${indice + 1}. ${p.titulo}</h4>
                        <p><span class="correta">Resposta correta:</span> ${p.explicacao}</p>
                    </div>
                </div>
            `);
        }
    });

    review.innerHTML = linhasRevisao.join("");
    review.classList.add("visivel");

    if (pontos === total) {
        resultado.className = "result good visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos!</strong><br>Excelente! Você reconheceu todos os sinais de golpe e de fake news desta rodada.`;
    } else if (pontos >= Math.ceil(total / 2)) {
        resultado.className = "result mid visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos.</strong><br>Você já reconhece boa parte dos sinais. Veja abaixo o que errou para fechar as lacunas.`;
    } else {
        resultado.className = "result bad visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos.</strong><br>Vale revisar as regras <strong>PARE, PENSE e CONFIRME</strong>. Confira abaixo, pergunta por pergunta, o que aconteceu.`;
    }

    resultado.scrollIntoView({ behavior: "smooth", block: "center" });

    // Mostra o botão de reiniciar e esconde o de corrigir,
    // já que as respostas já foram todas dadas.
    const botao = document.getElementById("btnCorrigir");
    const btnReiniciar = document.getElementById("btnTentarNovamente");
    if (botao) botao.style.display = "none";
    if (btnReiniciar) btnReiniciar.style.display = "inline-block";
}

function reiniciarQuiz() {
    const resultado = document.getElementById("result");
    const review = document.getElementById("review");
    const botao = document.getElementById("btnCorrigir");
    const btnReiniciar = document.getElementById("btnTentarNovamente");

    // Desmarca todas as respostas e tira o realce visual
    perguntasQuiz.forEach((p) => {
        document.querySelectorAll(`input[name="${p.nome}"]`).forEach((input) => {
            input.checked = false;
            input.closest(".option").classList.remove("selecionada");
        });
    });

    if (resultado) {
        resultado.className = "result";
        resultado.innerHTML = "";
    }

    if (review) {
        review.className = "review";
        review.innerHTML = "";
    }

    if (botao) botao.style.display = "inline-block";
    if (btnReiniciar) btnReiniciar.style.display = "none";

    atualizarProgresso();

    document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================
   VERIFICADOR COM IA
========================== */

// Ajuste este caminho se hospedar em outro provedor de funções serverless.
const VERIFICADOR_ENDPOINT = "/.netlify/functions/verificar";
const VERIFICADOR_MAX_LADO_PX = 1024; // redimensiona imagens grandes antes de enviar
const VERIFICADOR_QUALIDADE_JPEG = 0.8;

let verifImagemBase64 = null;
let verifImagemMimeType = null;

function initVerificador() {
    const form = document.getElementById("formVerificador");
    if (!form) return;

    const abas = document.querySelectorAll(".aba-verificador");
    const paineis = document.querySelectorAll(".painel-verificador");

    abas.forEach((aba) => {
        aba.addEventListener("click", () => {
            abas.forEach((a) => {
                a.classList.remove("ativa");
                a.setAttribute("aria-selected", "false");
            });
            paineis.forEach((p) => p.classList.remove("ativo"));

            aba.classList.add("ativa");
            aba.setAttribute("aria-selected", "true");
            document
                .querySelector(`.painel-verificador[data-painel="${aba.dataset.aba}"]`)
                ?.classList.add("ativo");
        });
    });

    const inputImagem = document.getElementById("verifImagem");
    const previewBox = document.getElementById("verifPreviewImagem");
    const previewImg = document.getElementById("verifPreviewImg");
    const btnRemoverImagem = document.getElementById("verifRemoverImagem");

    if (inputImagem) {
        inputImagem.addEventListener("change", async () => {
            const arquivo = inputImagem.files?.[0];
            if (!arquivo) return;

            if (!arquivo.type.startsWith("image/")) {
                mostrarErroVerificador("Envie um arquivo de imagem válido (JPG, PNG ou WebP).");
                inputImagem.value = "";
                return;
            }

            try {
                const { base64, mimeType, dataUrl } = await redimensionarImagem(arquivo);
                verifImagemBase64 = base64;
                verifImagemMimeType = mimeType;

                if (previewImg && previewBox) {
                    previewImg.src = dataUrl;
                    previewBox.hidden = false;
                }
            } catch {
                mostrarErroVerificador("Não foi possível processar essa imagem. Tente outro arquivo.");
            }
        });
    }

    if (btnRemoverImagem) {
        btnRemoverImagem.addEventListener("click", () => {
            verifImagemBase64 = null;
            verifImagemMimeType = null;
            if (inputImagem) inputImagem.value = "";
            if (previewBox) previewBox.hidden = true;
        });
    }

    form.addEventListener("submit", enviarParaVerificacao);
}

// Redimensiona a imagem no navegador antes de enviar, pra economizar
// dados e ficar dentro do limite da função serverless.
function redimensionarImagem(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => {
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;
                const maior = Math.max(width, height);

                if (maior > VERIFICADOR_MAX_LADO_PX) {
                    const escala = VERIFICADOR_MAX_LADO_PX / maior;
                    width = Math.round(width * escala);
                    height = Math.round(height * escala);
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", VERIFICADOR_QUALIDADE_JPEG);
                const base64 = dataUrl.split(",")[1];

                resolve({ base64, mimeType: "image/jpeg", dataUrl });
            };

            img.onerror = () => reject(new Error("Falha ao carregar imagem."));
            img.src = leitor.result;
        };

        leitor.onerror = () => reject(new Error("Falha ao ler arquivo."));
        leitor.readAsDataURL(arquivo);
    });
}

async function enviarParaVerificacao(evento) {
    evento.preventDefault();

    const texto = document.getElementById("verifTexto")?.value.trim() || "";
    const link = document.getElementById("verifLink")?.value.trim() || "";

    if (!texto && !link && !verifImagemBase64) {
        mostrarErroVerificador("Cole um texto, um link ou envie uma imagem antes de analisar.");
        return;
    }

    const btn = document.getElementById("btnVerificar");
    const carregando = document.getElementById("verifCarregando");
    const resultado = document.getElementById("verifResultado");

    esconderErroVerificador();
    if (resultado) {
        resultado.hidden = true;
        resultado.innerHTML = "";
    }
    if (btn) btn.disabled = true;
    if (carregando) carregando.hidden = false;

    try {
        const resp = await fetch(VERIFICADOR_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                texto,
                link,
                imagemBase64: verifImagemBase64,
                imagemMimeType: verifImagemMimeType,
            }),
        });

        const dados = await resp.json();

        if (!resp.ok) {
            throw new Error(dados?.erro || "Não foi possível concluir a análise.");
        }

        renderizarResultadoVerificador(dados.analise);
    } catch (erro) {
        mostrarErroVerificador(
            erro.message || "Erro ao conectar com o serviço de análise. Tente novamente."
        );
    } finally {
        if (btn) btn.disabled = false;
        if (carregando) carregando.hidden = true;
    }
}

function renderizarResultadoVerificador(analise) {
    const resultado = document.getElementById("verifResultado");
    if (!resultado || !analise) return;

    const nivel = ["baixo", "medio", "alto"].includes(analise.nivel_risco)
        ? analise.nivel_risco
        : "medio";

    const rotuloNivel = {
        baixo: "🟢 Risco baixo",
        medio: "🟡 Risco médio — vale checar",
        alto: "🔴 Risco alto — vários sinais de alerta",
    }[nivel];

    const listaSinais = (analise.sinais_encontrados || [])
        .map((s) => `<li>${escaparHtml(s)}</li>`)
        .join("") || "<li>Nenhum sinal específico identificado.</li>";

    const listaPositivos = (analise.sinais_positivos || [])
        .map((s) => `<li>${escaparHtml(s)}</li>`)
        .join("") || "<li>Nenhum sinal adicional de confiabilidade identificado.</li>";

    const listaRecomendacoes = (analise.recomendacoes || [])
        .map((s) => `<li>${escaparHtml(s)}</li>`)
        .join("") || "<li>Use agências de checagem como Aos Fatos ou Lupa.</li>";

    resultado.innerHTML = `
        <span class="verif-nivel ${nivel}">${rotuloNivel}</span>
        <p class="verif-resumo">${escaparHtml(analise.resumo || "")}</p>

        <div class="verif-colunas">
            <div class="verif-bloco">
                <h4>🚩 Sinais de atenção</h4>
                <ul>${listaSinais}</ul>
            </div>
            <div class="verif-bloco">
                <h4>✅ Sinais de confiabilidade</h4>
                <ul>${listaPositivos}</ul>
            </div>
        </div>

        <div class="verif-bloco" style="margin-bottom:18px;">
            <h4>🔎 O que fazer agora</h4>
            <ul>${listaRecomendacoes}</ul>
        </div>

        <p class="verif-aviso">${escaparHtml(
            analise.aviso ||
                "Esta análise é um apoio educativo gerado por IA e não substitui a checagem em fontes oficiais."
        )}</p>
    `;

    resultado.hidden = false;
    resultado.scrollIntoView({ behavior: "smooth", block: "center" });
}

function mostrarErroVerificador(mensagem) {
    const erro = document.getElementById("verifErro");
    if (!erro) return;
    erro.textContent = mensagem;
    erro.hidden = false;
}

function esconderErroVerificador() {
    const erro = document.getElementById("verifErro");
    if (!erro) return;
    erro.hidden = true;
    erro.textContent = "";
}

function escaparHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

/* =========================
   CHATBOT FLUTUANTE
========================== */

const CHAT_ENDPOINT = "/.netlify/functions/chat";
let chatHistorico = []; // { role: "user" | "assistant", content: string }
let chatAbertoUmaVez = false;

function initChatBot() {
    const toggle = document.getElementById("chatToggle");
    const painel = document.getElementById("chatPainel");
    const fechar = document.getElementById("chatFechar");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");

    if (!toggle || !painel || !form || !input) return;

    toggle.addEventListener("click", () => {
        const abrindo = painel.hidden;
        painel.hidden = !abrindo;
        toggle.setAttribute("aria-expanded", abrindo ? "true" : "false");

        if (abrindo) {
            if (!chatAbertoUmaVez) {
                chatAbertoUmaVez = true;
                adicionarMensagemChat(
                    "assistente",
                    "Oi! 👋 Sou o assistente do site. Pode perguntar sobre golpes, Pix, WhatsApp, fake news ou colar uma mensagem suspeita que eu te ajudo a analisar os sinais."
                );
            }
            input.focus();
        }
    });

    if (fechar) {
        fechar.addEventListener("click", () => {
            painel.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
            toggle.focus();
        });
    }

    // Cresce a caixa de texto conforme o usuário digita, até um limite (feito via CSS max-height)
    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = `${input.scrollHeight}px`;
    });

    // Enter envia, Shift+Enter quebra linha
    input.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" && !evento.shiftKey) {
            evento.preventDefault();
            form.requestSubmit();
        }
    });

    form.addEventListener("submit", enviarMensagemChat);
}

async function enviarMensagemChat(evento) {
    evento.preventDefault();

    const input = document.getElementById("chatInput");
    const botaoEnviar = document.getElementById("chatEnviar");
    if (!input) return;

    const texto = input.value.trim();
    if (!texto) return;

    adicionarMensagemChat("usuario", texto);
    chatHistorico.push({ role: "user", content: texto });

    input.value = "";
    input.style.height = "auto";
    if (botaoEnviar) botaoEnviar.disabled = true;

    const idCarregando = mostrarCarregandoChat();

    try {
        const resp = await fetch(CHAT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensagens: chatHistorico }),
        });

        const dados = await resp.json();
        removerCarregandoChat(idCarregando);

        if (!resp.ok) {
            throw new Error(dados?.erro || "Não foi possível responder agora.");
        }

        adicionarMensagemChat("assistente", dados.resposta);
        chatHistorico.push({ role: "assistant", content: dados.resposta });
    } catch (erro) {
        removerCarregandoChat(idCarregando);
        adicionarMensagemChat(
            "erro",
            erro.message || "Erro ao conectar com o assistente. Tente novamente."
        );
    } finally {
        if (botaoEnviar) botaoEnviar.disabled = false;
        input.focus();
    }
}

function adicionarMensagemChat(tipo, texto) {
    const container = document.getElementById("chatMensagens");
    if (!container) return;

    const balao = document.createElement("div");
    balao.className = `chat-msg ${tipo}`;
    balao.textContent = texto;

    container.appendChild(balao);
    container.scrollTop = container.scrollHeight;
}

function mostrarCarregandoChat() {
    const container = document.getElementById("chatMensagens");
    if (!container) return null;

    const balao = document.createElement("div");
    balao.className = "chat-msg carregando";
    balao.textContent = "Digitando...";
    balao.id = `chat-carregando-${Date.now()}`;

    container.appendChild(balao);
    container.scrollTop = container.scrollHeight;

    return balao.id;
}

function removerCarregandoChat(id) {
    if (!id) return;
    document.getElementById(id)?.remove();
}

/* =========================
   INICIALIZAÇÃO
========================== */

document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    initSimulacao();
    initCardsExpansiveis();
    initContadores();
    initReveal();
    initQuiz();
    initVerificador();
    initChatBot();
});
