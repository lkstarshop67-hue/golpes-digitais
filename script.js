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

    // Fecha o menu ao clicar em um link (útil no celular)
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
   QUIZ: PERGUNTAS E RESPOSTAS
========================== */

// Cada pergunta guarda a explicação da alternativa correta,
// exibida assim que a pessoa responde (feedback imediato).
const perguntasQuiz = [
    {
        nome: "q1",
        explicacao: "Mensagens que criam urgência (\"agora\", \"vai bloquear\") são uma tática clássica para impedir que você pare e pense. O caminho seguro é acessar o site ou app oficial diretamente, sem clicar em links recebidos."
    },
    {
        nome: "q2",
        explicacao: "O código de verificação por SMS serve para confirmar que é você quem está entrando na conta. Nenhuma empresa ou suporte legítimo precisa desse código — pedir isso é sempre sinal de golpe."
    },
    {
        nome: "q3",
        explicacao: "Conferir nome, valor, instituição e motivo evita o golpe mais comum do Pix: a pressa. Depois de enviado, o dinheiro é muito difícil de recuperar."
    },
    {
        nome: "q4",
        explicacao: "Uma notícia sem fonte identificada, sem data e que só circula em grupos de mensagem (sem aparecer em nenhum veículo de imprensa) é um forte sinal de desinformação."
    },
    {
        nome: "q5",
        explicacao: "Textos que usam muitas letras maiúsculas, excesso de exclamações e pedem para \"compartilhar urgente\" tentam gerar reação emocional em vez de informar — outro sinal comum de fake news."
    }
];

function initQuiz() {
    const botao = document.getElementById("btnCorrigir");
    if (!botao) return;

    // Mostra a explicação assim que o usuário escolhe uma opção
    perguntasQuiz.forEach((p) => {
        const inputs = document.querySelectorAll(`input[name="${p.nome}"]`);
        const feedback = document.getElementById(`feedback-${p.nome}`);

        inputs.forEach((input) => {
            input.addEventListener("change", () => {
                if (feedback) {
                    feedback.textContent = p.explicacao;
                    feedback.classList.add("visivel");
                }
            });
        });
    });

    botao.addEventListener("click", corrigirQuiz);
}

function corrigirQuiz() {
    let pontos = 0;
    let respondidas = 0;

    perguntasQuiz.forEach((p) => {
        const resposta = document.querySelector(`input[name="${p.nome}"]:checked`);
        if (resposta) {
            respondidas++;
            pontos += Number(resposta.value);
        }
    });

    const resultado = document.getElementById("result");
    if (!resultado) return;

    const total = perguntasQuiz.length;

    if (respondidas < total) {
        resultado.className = "result mid visivel";
        resultado.textContent = `Responda todas as ${total} perguntas antes de conferir o resultado. Faltam ${total - respondidas}.`;
        resultado.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    if (pontos === total) {
        resultado.className = "result good visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos!</strong><br>Muito bem! Você reconheceu os principais sinais de golpe e de fake news.`;
    } else if (pontos >= Math.ceil(total / 2)) {
        resultado.className = "result mid visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos.</strong><br>Você já reconhece boa parte dos sinais. Releia as explicações acima para fechar as lacunas.`;
    } else {
        resultado.className = "result bad visivel";
        resultado.innerHTML = `<strong>${pontos}/${total} acertos.</strong><br>Revise as regras <strong>PARE, PENSE e CONFIRME</strong> antes de agir, e confira as explicações de cada pergunta acima.`;
    }

    resultado.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* =========================
   INICIALIZAÇÃO
========================== */

document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    initSimulacao();
    initQuiz();
});
