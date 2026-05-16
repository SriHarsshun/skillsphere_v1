/**
 * SkillSphere — Login/Register with AI Domain Recommendation Modal
 */
(function () {
    'use strict';

    // ===== Particle Canvas Animation =====
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canvas = document.getElementById('particleCanvas');
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize(); window.addEventListener('resize', resize);
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width, y: Math.random() * canvas.height,
                r: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.3, vy: -(Math.random() * 0.4 + 0.1),
                a: Math.random() * 0.4 + 0.1
            });
        }
        (function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.fill();
            });
            requestAnimationFrame(animate);
        })();
    }

    // Already logged in?
    if (localStorage.getItem('ss_token')) { window.location.href = '/dashboard'; return; }

    // DOM
    const authForm = document.getElementById('authForm');
    const loginModeBtn = document.getElementById('loginModeBtn');
    const registerModeBtn = document.getElementById('registerModeBtn');
    const modeIndicator = document.getElementById('modeIndicator');
    const switchLink = document.getElementById('switchLink');
    const nameField = document.getElementById('nameField');
    const roleField = document.getElementById('roleField');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const footerText = document.getElementById('footerText');
    const btnText = document.getElementById('btnText');
    const errorMsg = document.getElementById('errorMsg');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    const rolePills = document.querySelectorAll('.role-pill');
    const rolePillsContainer = document.getElementById('rolePills');

    let isRegister = false;
    let selectedRole = 'student'; // Default to student
    let registrationData = null; // Store temp sign up data before domain picking

    // Set initial active state for student pill
    const defaultPill = document.querySelector('.role-pill[data-role="student"]');
    if (defaultPill) defaultPill.classList.add('active');

    // ===== Mode Toggle =====
    function setMode(register) {
        isRegister = register;
        errorMsg.textContent = '';
        errorMsg.className = 'error-msg';

        if (register) {
            modeIndicator.classList.add('right');
            registerModeBtn.classList.add('active');
            loginModeBtn.classList.remove('active');
            nameField.style.display = 'block';
            roleField.style.display = 'block';
            formTitle.textContent = 'Create account';
            formSubtitle.textContent = 'Start your learning journey today';
            btnText.textContent = 'Create Account';
            footerText.innerHTML = 'Already have an account? <a href="#" id="switchLink">Sign in</a>';
        } else {
            modeIndicator.classList.remove('right');
            loginModeBtn.classList.add('active');
            registerModeBtn.classList.remove('active');
            nameField.style.display = 'none';
            roleField.style.display = 'none';
            formTitle.textContent = 'Welcome back';
            formSubtitle.textContent = 'Sign in to continue your journey';
            btnText.textContent = 'Sign In';
            footerText.innerHTML = 'Don\'t have an account? <a href="#" id="switchLink">Sign up</a>';
        }
    }

    // Bind mode toggle listeners once
    loginModeBtn.addEventListener('click', () => setMode(false));
    registerModeBtn.addEventListener('click', () => setMode(true));
    
    // Use event delegation or re-bind carefully for dynamic links
    footerText.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'switchLink') {
            e.preventDefault();
            setMode(!isRegister);
        }
    });

    // ===== Role Selection =====
    rolePills.forEach(pill => {
        pill.addEventListener('click', () => {
            rolePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            selectedRole = pill.dataset.role;
        });
    });

    // ===== Password Toggle =====
    togglePasswordBtn.addEventListener('click', () => {
        const isPass = passwordInput.type === 'password';
        passwordInput.type = isPass ? 'text' : 'password';
        togglePasswordBtn.querySelector('.eye-open').style.display = isPass ? 'none' : 'block';
        togglePasswordBtn.querySelector('.eye-closed').style.display = isPass ? 'block' : 'none';
    });

    // ===== Form Submit =====
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';
        errorMsg.className = 'error-msg';

        if (isRegister && !selectedRole) {
            rolePillsContainer.classList.remove('shake');
            rolePillsContainer.offsetHeight;
            rolePillsContainer.classList.add('shake');
            setTimeout(() => rolePillsContainer.classList.remove('shake'), 500);
            errorMsg.textContent = 'Please select your role';
            return;
        }

        const email = document.getElementById('emailInput').value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            errorMsg.textContent = 'Please fill in all fields';
            return;
        }

        if (isRegister) {
            const name = document.getElementById('nameInput').value.trim();
            if (!name) { errorMsg.textContent = 'Please enter your name'; return; }

            // Store data and begin AI workflow if student
            registrationData = { name, email, password, role: selectedRole };
            
            if (selectedRole === 'student') {
                startAIChat();
            } else {
                completeRegistration(); // Mentors/Admins don't need domain recommended
            }
        } else {
            const submitBtn = document.getElementById('submitBtn');
            const origText = btnText.textContent;
            submitBtn.disabled = true;
            btnText.textContent = 'Signing in...';

            try {
                await doLogin(email, password);
            } catch (err) {
                errorMsg.className = 'error-msg';
                errorMsg.textContent = err.message;
                submitBtn.disabled = false;
                btnText.textContent = origText;
            }
        }
    });

    async function completeRegistration(domain = null) {
        if (!registrationData) return;
        
        const submitBtn = document.getElementById('submitBtn');
        const origText = btnText.textContent;
        submitBtn.disabled = true;
        btnText.textContent = 'Creating...';
        
        try {
            const reqBody = { ...registrationData };
            if (domain) reqBody.domain = domain;

            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqBody)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Hide AI overlay if it was open
            aiOverlay.classList.remove('active');

            errorMsg.className = 'error-msg success';
            errorMsg.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:14px;height:14px;margin-right:6px;vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>Account created! Signing in...';
            
            // Auto-login after registration with proper error handling
            setTimeout(async () => {
                try {
                    await doLogin(registrationData.email, registrationData.password);
                } catch (loginErr) {
                    // Registration succeeded but auto-login failed — switch to login mode
                    errorMsg.className = 'error-msg success';
                    errorMsg.textContent = 'Account created! Please sign in with your credentials.';
                    submitBtn.disabled = false;
                    btnText.textContent = 'Sign In';
                    setMode(false); // Switch to login mode
                }
            }, 800);
        } catch (err) {
            aiOverlay.classList.remove('active');
            errorMsg.className = 'error-msg';
            errorMsg.textContent = err.message;
            submitBtn.disabled = false;
            btnText.textContent = origText;
        }
    }

    async function doLogin(email, password) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem('ss_token', data.token);
        localStorage.setItem('ss_user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
    }


    /* ================================================================
       AI CHATBOT LOGIC
       ================================================================ */

    const aiOverlay = document.getElementById('aiOverlay');
    const aiCloseBtn = document.getElementById('aiCloseBtn');
    const aiChat = document.getElementById('aiChat');
    const aiInputArea = document.getElementById('aiInputArea');
    const aiStatus = document.querySelector('.ai-status');

    let currentQuestionIndex = 0;
    let userAnswers = [];

    // The questions flow
    const aiQuestions = [
        {
            text: `Hi ${getNameFirstName()}! I'm your AI guide. Let's find the best domain for you. First, what interests you the most?`,
            type: 'options',
            options: [
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>', text: 'Building Websites & UI', value: 'building websites visual frontend ui design' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v4a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1H4a1 1 0 0 1-1-1v-4a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M9 13v2"/><path d="M15 13v2"/></svg>', text: 'Data & AI', value: 'data machine learning AI solving puzzles prediction' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', text: 'Hacking & Security', value: 'security hacking protecting systems' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>', text: 'Mobile Apps', value: 'mobile apps android ios' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>', text: 'Servers & Cloud', value: 'servers cloud scalable infrastructure' }
            ]
        },
        {
            text: "Cool! What's your current experience level with coding?",
            type: 'options',
            options: [
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s-4-6-4-10a4 4 0 0 1 8 0c0 4-4 10-4 10z"/><circle cx="12" cy="10" r="1"/></svg>', text: 'Beginner', value: 'beginner' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', text: 'Intermediate', value: 'intermediate' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>', text: 'Advanced', value: 'advanced' }
            ]
        },
        {
            text: "And what kind of work style do you enjoy more?",
            type: 'options',
            options: [
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', text: 'Creative & Visually pleasing', value: 'creative visual artistic' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>', text: 'Logical & Problem solving', value: 'logical analytical problem-solving math detective' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', text: 'Building Infrastructure', value: 'infrastructure systems planning automation' }
            ]
        },
        {
            text: "Last question! Pick one project that excites you the most:",
            type: 'options',
            options: [
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', text: 'An interactive E-commerce Website', value: 'interactive website landing page web app' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>', text: 'An AI that predicts stock prices', value: 'predict model chatbot neural' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', text: 'Finding vulnerabilities in a bank network', value: 'hack penetration vulnerability ctf' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>', text: 'A viral Mobile Game or Utility App', value: 'mobile android ios app' },
                { emoji: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', text: 'Automating deployment for 1000 servers', value: 'automate ci/cd pipeline docker scale' }
            ]
        }
    ];

    function getNameFirstName() {
        if (!registrationData || !registrationData.name) return 'there';
        return registrationData.name.split(' ')[0];
    }

    function startAIChat() {
        aiOverlay.classList.add('active');
        aiChat.innerHTML = '';
        aiInputArea.innerHTML = '';
        currentQuestionIndex = 0;
        userAnswers = [];
        aiStatus.textContent = 'Finding your perfect domain...';
        
        // Render progress bar
        renderProgress();
        askQuestion(0);
    }

    function renderProgress() {
        let dotsHTML = '';
        for (let i = 0; i < aiQuestions.length; i++) {
            let stateClass = '';
            if (i < currentQuestionIndex) stateClass = 'done';
            else if (i === currentQuestionIndex) stateClass = 'current';
            dotsHTML += `<div class="ai-progress-dot ${stateClass}"></div>`;
        }
        
        let progressDiv = document.getElementById('aiProgress');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'aiProgress';
            progressDiv.className = 'ai-progress';
            aiInputArea.parentElement.insertBefore(progressDiv, aiInputArea); // Insert above input area
        }
        progressDiv.innerHTML = dotsHTML;
    }

    aiCloseBtn.addEventListener('click', () => {
        if (confirm('Skip domain recommendation and just register?')) {
            completeRegistration(null);
        }
    });

    async function askQuestion(index) {
        if (index >= aiQuestions.length) {
            await fetchRecommendations();
            return;
        }

        renderProgress();
        const q = aiQuestions[index];
        if (index === 0) {
            q.text = `Hi ${getNameFirstName()}! I'm your AI guide. Let's find the best domain for you. First, what interests you the most?`;
        }
        
        await showTyping();
        addMessage(q.text, 'bot');
        renderInputOptions(q);
    }

    async function showTyping() {
        return new Promise(resolve => {
            const typing = document.createElement('div');
            typing.className = 'ai-typing';
            typing.innerHTML = '<span></span><span></span><span></span>';
            aiChat.appendChild(typing);
            scrollToBottom();

            setTimeout(() => {
                typing.remove();
                resolve();
            }, 800 + Math.random() * 800); // 0.8s - 1.6s typing delay
        });
    }

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `ai-msg ${sender}`;
        msg.innerHTML = text;
        aiChat.appendChild(msg);
        scrollToBottom();
    }

    function scrollToBottom() {
        aiChat.scrollTop = aiChat.scrollHeight;
    }

    function renderInputOptions(question) {
        aiInputArea.innerHTML = '';
        
        if (question.type === 'options') {
            const optsContainer = document.createElement('div');
            optsContainer.className = 'ai-options';
            
            question.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'ai-option-btn';
                btn.innerHTML = `<span class="option-emoji">${opt.emoji}</span> ${opt.text}`;
                btn.onclick = () => {
                    handleAnswer(opt.text, opt.value);
                };
                optsContainer.appendChild(btn);
            });
            
            aiInputArea.appendChild(optsContainer);
            
            // Add skip option below
            const skipBtn = document.createElement('button');
            skipBtn.className = 'ai-skip-btn';
            skipBtn.textContent = 'Skip this question';
            skipBtn.onclick = () => handleAnswer('', '');
            aiInputArea.appendChild(skipBtn);
        }
    }

    function handleAnswer(displayHtml, valueToStore) {
        aiInputArea.innerHTML = ''; // clear input
        if (displayHtml) {
            addMessage(displayHtml, 'user');
        }
        
        userAnswers.push(valueToStore);
        currentQuestionIndex++;
        
        setTimeout(() => askQuestion(currentQuestionIndex), 400);
    }

    async function fetchRecommendations() {
        const progressDiv = document.getElementById('aiProgress');
        if (progressDiv) progressDiv.remove();
        
        aiInputArea.innerHTML = '';
        aiStatus.textContent = 'Analyzing your responses...';
        await showTyping();
        addMessage('Analyzing your profile based on your answers...', 'bot');

        try {
            const res = await fetch('/api/ai/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: userAnswers })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error);

            aiStatus.textContent = 'Recommendations ready!';
            await showTyping();
            addMessage('Here are the best domains for you! Click one to select it and finish signing up.', 'bot');
            
            renderRecommendations(data.recommendations);
            
        } catch (err) {
            addMessage('Oops! Could not fetch recommendations. You can skip for now.', 'bot');
            const skipBtn = document.createElement('button');
            skipBtn.className = 'submit-btn';
            skipBtn.textContent = 'Skip & Finish Registration';
            skipBtn.onclick = () => completeRegistration(null);
            aiInputArea.appendChild(skipBtn);
        }
    }

    function renderRecommendations(recs) {
        aiInputArea.innerHTML = ''; // Clear options
        
        const grid = document.createElement('div');
        grid.className = 'ai-rec-grid';
        
        const colors = ['#6c5ce7', '#00b894', '#0984e3'];
        const domainIcons = {
            'web development': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            'artificial intelligence': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v4a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1H4a1 1 0 0 1-1-1v-4a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><path d="M9 13v2"/><path d="M15 13v2"/></svg>',
            'cloud computing': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
            'devops': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
            'cybersecurity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
            'mobile development': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>'
        };

        recs.forEach((rec, i) => {
            const isTop = i === 0;
            const iconStr = domainIcons[(rec.name || '').toLowerCase()] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
            
            const card = document.createElement('div');
            card.className = `ai-rec-card ${isTop ? 'top-pick' : ''}`;
            card.innerHTML = `
                <div class="ai-rec-icon" style="background:${colors[i%colors.length]}15; color:${colors[i%colors.length]}">${iconStr}</div>
                <div class="ai-rec-info">
                    <div class="ai-rec-name">${rec.name}</div>
                    <div class="ai-rec-reason">${rec.reason}</div>
                </div>
                <div class="ai-rec-match">
                    <div class="ai-rec-percent">${rec.matchPercent}%</div>
                    <div class="ai-rec-label">Match</div>
                </div>
            `;
            
            card.onclick = () => {
                aiStatus.textContent = 'Finishing registration...';
                aiInputArea.innerHTML = '';
                addMessage(`I selected <strong>${rec.name}</strong>. Great choice!`, 'user');
                setTimeout(() => completeRegistration(rec.name), 800);
            };
            
            grid.appendChild(card);
        });
        
        aiChat.appendChild(grid);
        scrollToBottom();
        
        // Skip final registration option
        const skipBtn = document.createElement('button');
        skipBtn.className = 'ai-skip-btn';
        skipBtn.textContent = 'I will decide my domain later';
        skipBtn.onclick = () => completeRegistration(null);
        aiInputArea.appendChild(skipBtn);
    }
    // ===== Theme Toggle =====
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const sunIcon = themeToggle.querySelector('.sun-icon');
        const moonIcon = themeToggle.querySelector('.moon-icon');

        const updateThemeIcons = () => {
            if (document.body.classList.contains('dark-theme')) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'block';
            } else {
                sunIcon.style.display = 'block';
                moonIcon.style.display = 'none';
            }
        };

        // Initial icon state
        updateThemeIcons();

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateThemeIcons();
        });
    }

})();