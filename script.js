let API_BASE_URL = window.location.origin;
let CONFIG = {
    WHATSAPP_BASE_URL: 'https://wa.me/',
    TWITTER_BASE_URL: 'https://twitter.com/intent/tweet',
    FACEBOOK_BASE_URL: 'https://www.facebook.com/sharer/sharer.php'
};

let signatureCount = 0;

async function loadConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/config`);
        const config = await response.json();
        CONFIG = { ...CONFIG, ...config };
        API_BASE_URL = config.BASE_URL || API_BASE_URL;
    } catch (error) {
        console.warn('Erro ao carregar configurações, usando valores padrão:', error);
    }
}

async function fetchSignatureCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signatures/count`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        signatureCount = data.count;
        return data.count;
    } catch (error) {
        document.getElementById('signatureCounter').style.display = 'none';
        console.error('Erro na requisição de contagem:', error);
    }
}

async function updateCounter() {
    const count = await fetchSignatureCount();
    const counterElement = document.getElementById('counterNumber');
    if (counterElement) {
        counterElement.textContent = count.toLocaleString('pt-BR');
    }
}

function validateForm() {
    const name = document.getElementById('nameInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const consent = document.getElementById('consentCheckbox').checked;
    const button = document.getElementById('signButton');

    const nameValid = name.length >= 3;
    const emailValid = !email || isValidEmail(email);
    const consentValid = consent;

    button.disabled = !(nameValid && emailValid && consentValid);
}

document.addEventListener('DOMContentLoaded', async function() {
    await loadConfig();

    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const consentCheckbox = document.getElementById('consentCheckbox');

    if (nameInput) {
        nameInput.addEventListener('input', function() {
            validateForm();
            if (typeof gtag !== 'undefined' && nameInput.value.length > 0) {
                gtag('event', 'form_start', {
                    'event_category': 'engagement',
                    'event_label': 'name_field'
                });
            }
        });

        nameInput.addEventListener('focus', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_interaction', {
                    'event_category': 'engagement',
                    'event_label': 'name_field_focus'
                });
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateForm();
            if (typeof gtag !== 'undefined' && emailInput.value.length > 0) {
                gtag('event', 'form_start', {
                    'event_category': 'engagement',
                    'event_label': 'email_field'
                });
            }
        });

        emailInput.addEventListener('focus', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'form_interaction', {
                    'event_category': 'engagement',
                    'event_label': 'email_field_focus'
                });
            }
        });
    }

    if (consentCheckbox) {
        consentCheckbox.addEventListener('change', function() {
            validateForm();
            if (typeof gtag !== 'undefined' && consentCheckbox.checked) {
                gtag('event', 'form_interaction', {
                    'event_category': 'engagement',
                    'event_label': 'consent_accepted'
                });
            }
        });
    }

    validateForm();

    updateCounter();
});

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signatureForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('nameInput').value.trim();
            const email = document.getElementById('emailInput').value.trim();
            const consent = document.getElementById('consentCheckbox').checked;
            if (!name) {
                showError('Por favor, preencha o seu nome.');
                return;
            }

            if (!consent) {
                showError('Por favor, aceite os termos de consentimento.');
                return;
            }

            if (email && !isValidEmail(email)) {
                showError('Por favor, insira um e-mail válido.');
                return;
            }
            const button = document.getElementById('signButton');
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Assinando...';

            try {
                const response = await fetch(`${API_BASE_URL}/api/signatures`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email || null,
                        consent: consent
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showSuccess(data.message || 'Assinatura registrada com sucesso!');

                    document.getElementById('nameInput').value = '';
                    document.getElementById('emailInput').value = '';
                    document.getElementById('consentCheckbox').checked = false;

                    await updateCounter();

                    validateForm();

                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'manifesto_signed', {
                            'event_category': 'engagement',
                            'event_label': name,
                            'value': 1
                        });

                        gtag('event', 'conversion', {
                            'send_to': 'AW-17587495960/C1A0CIbV854bEJjIr8JB',
                            'value': 1.0,
                            'currency': 'BRL'
                        });

                        gtag('event', 'sign_up', {
                            'method': 'manifesto_form'
                        });

                        if (email) {
                            gtag('event', 'beta_tester_signup', {
                                'event_category': 'engagement',
                                'event_label': 'with_email'
                            });
                        }
                    }

                } else {
                    showError(data.error || 'Erro ao processar assinatura.');
                }

            } catch (error) {
                console.error('Erro ao enviar assinatura:', error);
                showError('Erro de conexão. Verifique sua internet e tente novamente.');
            } finally {
                button.textContent = originalText;
                validateForm();
            }
        });
    }
});

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function showSuccess(message = 'Obrigado por assinar! Você agora faz parte do movimento.') {
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    if (successMsg && errorMsg) {
        errorMsg.style.display = 'none';
        successMsg.textContent = message;
        successMsg.style.display = 'block';

        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 5000);
    }
}

function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    if (errorMsg && successMsg) {
        successMsg.style.display = 'none';
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';

        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 5000);
    }
}

function shareOnWhatsApp() {
    const text = 'Acabei de assinar o Manifesto Faça a Lista! Junte-se a nós na luta contra a fome no Brasil. 💚';
    const url = window.location.href;
    window.open(`${CONFIG.WHATSAPP_BASE_URL}?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
}

function shareOnTwitter() {
    const text = 'Assinei o Manifesto @FacaALista! Tecnologia com propósito social para combater a fome no Brasil 💚 #FaçaALista #BrasilSemFome';
    const url = window.location.href;
    window.open(`${CONFIG.TWITTER_BASE_URL}?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function shareOnFacebook() {
    const url = window.location.href;
    window.open(`${CONFIG.FACEBOOK_BASE_URL}?u=${encodeURIComponent(url)}`, '_blank');
}

function copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showSuccess('Link copiado! Compartilhe com seus amigos.');
    }).catch(() => {
        showError('Erro ao copiar link. Tente manualmente.');
    });
}

setInterval(updateCounter, 30000);