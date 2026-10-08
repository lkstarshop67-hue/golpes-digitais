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

let perguntaAtual = 0;

function obterFieldsets() {
    return Array.from(document.querySelectorAll(".quiz .question"));
}

function initQuiz() {
    const botao = document.getElementById("btnCorrigir");
    const btnReiniciar = document.getElementById("btnTentarNovamente");
    if (!botao) return;

    mostrarPergunta(0);
    atualizarProgresso();

    // Ao escolher uma alternativa, a resposta é travada e o feedback aparece na hora.
    perguntasQuiz.forEach((p, indice) => {
        const inputs = document.querySelectorAll(`input[name="${p.nome}"]`);

        inputs.forEach((input) => {
            input.addEventListener("change", () => responderPergunta(indice, input));
        });
    });

    botao.addEventListener("click", avancarQuiz);

    if (btnReiniciar) {
        btnReiniciar.addEventListener("click", reiniciarQuiz);
    }
}

function mostrarPergunta(indice) {
    perguntaAtual = indice;
    obterFieldsets().forEach((fs, i) => {
        fs.classList.toggle("ativa", i === indice);
    });
    atualizarBotaoAvancar(false);
}

function responderPergunta(indice, inputEscolhido) {
    const p = perguntasQuiz[indice];
    const inputs = document.querySelectorAll(`input[name="${p.nome}"]`);
    const acertou = Number(inputEscolhido.value) === 1;

    inputs.forEach((input) => {
        const opcao = input.closest(".option");
        input.disabled = true;
        opcao.classList.add("travada");

        if (Number(input.value) === 1) {
            opcao.classList.add("correta");
        } else if (input === inputEscolhido) {
            opcao.classList.add("incorreta");
        }
    });

    const feedback = document.getElementById(`feedback-${p.nome}`);
    if (feedback) {
        feedback.innerHTML = `
            <span class="veredito ${acertou ? "certo" : "errado"}">
                ${acertou ? "✅ Isso mesmo!" : "❌ Não foi dessa vez."}
            </span>
            ${p.explicacao}
        `;
        feedback.classList.add("visivel");
    }

    atualizarProgresso();
    atualizarBotaoAvancar(true);
}

function atualizarBotaoAvancar(respondida) {
    const botao = document.getElementById("btnCorrigir");
    if (!botao) return;

    const ultima = perguntaAtual === perguntasQuiz.length - 1;
    botao.disabled = !respondida;

    if (!respondida) {
        botao.textContent = "Responda para continuar";
    } else {
        botao.textContent = ultima ? "Ver resultado final" : "Próxima pergunta →";
    }
}

function avancarQuiz() {
    const ultima = perguntaAtual === perguntasQuiz.length - 1;

    if (ultima) {
        mostrarResultadoFinal();
        return;
    }

    mostrarPergunta(perguntaAtual + 1);
    document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
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
            ? `Todas as ${total} perguntas respondidas`
            : `Pergunta ${Math.min(perguntaAtual + 1, total)} de ${total} — ${respondidas} respondida${respondidas === 1 ? "" : "s"}`;
    }

    if (barra) {
        barra.style.width = `${(respondidas / total) * 100}%`;
    }
}

function mostrarResultadoFinal() {
    const total = perguntasQuiz.length;
    const resultado = document.getElementById("result");
    const review = document.getElementById("review");
    if (!resultado || !review) return;

    let pontos = 0;
    const linhasRevisao = [];

    perguntasQuiz.forEach((p, indice) => {
        const escolha = document.querySelector(`input[name="${p.nome}"]:checked`);
        const acertou = escolha && Number(escolha.value) === 1;

        if (acertou) pontos++;

        linhasRevisao.push(`
            <div class="review-item ${acertou ? "certo" : "errado"}">
                <div class="review-icon">${acertou ? "✅" : "❌"}</div>
                <div class="review-content">
                    <h4>${indice + 1}. ${p.titulo}</h4>
                    <p>${acertou ? "" : '<span class="correta">Resposta correta:</span> '}${p.explicacao}</p>
                </div>
            </div>
        `);
    });

    review.innerHTML = linhasRevisao.join("");
    review.classList.add("visivel");

    if (pontos === total) {
        resultado.className = "result good visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos!</strong><br>Excelente! Você reconheceu todos os sinais de golpe e de fake news desta rodada. Compartilhe o que aprendeu com quem você conhece.`;
    } else if (pontos >= Math.ceil(total / 2)) {
        resultado.className = "result mid visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos.</strong><br>Você já reconhece boa parte dos sinais. Veja abaixo o que errou para fechar as lacunas.`;
    } else {
        resultado.className = "result bad visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos.</strong><br>Vale revisar as regras <strong>PARE, PENSE e CONFIRME</strong>. Confira abaixo, pergunta por pergunta, o que aconteceu.`;
    }

    // Esconde a pergunta atual e o botão de avançar; mostra o de recomeçar.
    obterFieldsets().forEach((fs) => fs.classList.remove("ativa"));
    const botao = document.getElementById("btnCorrigir");
    const btnReiniciar = document.getElementById("btnTentarNovamente");
    if (botao) botao.style.display = "none";
    if (btnReiniciar) btnReiniciar.style.display = "inline-block";

    resultado.scrollIntoView({ behavior: "smooth", block: "center" });
}

function reiniciarQuiz() {
    const resultado = document.getElementById("result");
    const review = document.getElementById("review");
    const botao = document.getElementById("btnCorrigir");
    const btnReiniciar = document.getElementById("btnTentarNovamente");

    perguntasQuiz.forEach((p) => {
        document.querySelectorAll(`input[name="${p.nome}"]`).forEach((input) => {
            input.checked = false;
            input.disabled = false;
            input.closest(".option").classList.remove("travada", "correta", "incorreta");
        });

        const feedback = document.getElementById(`feedback-${p.nome}`);
        if (feedback) {
            feedback.innerHTML = "";
            feedback.classList.remove("visivel");
        }
    });

    if (resultado) {
        resultado.className = "result";
        resultado.innerHTML = "";
    }

    if (review) {
        review.className = "review";
        review.innerHTML = "";
    }

    if (botao) botao.style.display = "";
    if (btnReiniciar) btnReiniciar.style.display = "none";

    mostrarPergunta(0);
    atualizarProgresso();

    document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
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
});
