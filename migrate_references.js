/**
 * Migration: Add references table and seed with curated free learning resources
 * Run once: node migrate_references.js
 */
require('dotenv').config();
const db = require('./config/db');

async function migrate() {
    try {
        console.log('Creating references table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS learning_references (
                id INT AUTO_INCREMENT PRIMARY KEY,
                domain_id INT NOT NULL,
                phase VARCHAR(50),
                title VARCHAR(300) NOT NULL,
                url VARCHAR(500) NOT NULL,
                description TEXT,
                type ENUM('article', 'video', 'course', 'tool', 'documentation', 'other') DEFAULT 'article',
                source VARCHAR(200),
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('✓ Table created');

        // Check if data already exists
        const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM learning_references');
        if (count > 0) {
            console.log(`✓ Already has ${count} references, skipping seed`);
            process.exit(0);
        }

        // Get domain IDs dynamically
        const [domains] = await db.query('SELECT id, name FROM domains ORDER BY name');
        const domainMap = {};
        domains.forEach(d => { domainMap[d.name.toLowerCase()] = d.id; });
        console.log('Found domains:', Object.keys(domainMap).join(', '));

        const seedData = [
            // ==================== WEB DEVELOPMENT ====================
            { domain: 'web development', refs: [
                // Phase 1: HTML & CSS Foundations
                { phase: 'Phase 1', title: 'MDN Web Docs — HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', description: 'Mozilla\'s comprehensive guide to learning HTML from scratch. Covers elements, attributes, forms, and semantic markup.', type: 'documentation', source: 'MDN' },
                { phase: 'Phase 1', title: 'freeCodeCamp — Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', description: 'Free interactive course covering HTML and CSS fundamentals with hands-on projects.', type: 'course', source: 'freeCodeCamp' },
                { phase: 'Phase 1', title: 'CSS Tricks — A Complete Guide to Flexbox', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', description: 'The definitive visual guide to CSS Flexbox layout with examples and diagrams.', type: 'article', source: 'CSS-Tricks' },
                { phase: 'Phase 1', title: 'CSS Tricks — A Complete Guide to Grid', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', description: 'Comprehensive visual reference for CSS Grid layout system.', type: 'article', source: 'CSS-Tricks' },
                // Phase 2: JavaScript Essentials
                { phase: 'Phase 2', title: 'JavaScript.info — The Modern JavaScript Tutorial', url: 'https://javascript.info/', description: 'From basics to advanced topics with detailed explanations and interactive examples.', type: 'documentation', source: 'JavaScript.info' },
                { phase: 'Phase 2', title: 'freeCodeCamp — JavaScript Algorithms and Data Structures', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', description: 'Free certification course covering ES6+, regex, debugging, OOP, and functional programming.', type: 'course', source: 'freeCodeCamp' },
                { phase: 'Phase 2', title: 'Traversy Media — JavaScript Crash Course', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c', description: 'Fast-paced 1.5 hour JavaScript crash course covering all core concepts.', type: 'video', source: 'YouTube' },
                // Phase 3: Frontend Frameworks
                { phase: 'Phase 3', title: 'React Official Tutorial — Tic-Tac-Toe', url: 'https://react.dev/learn/tutorial-tic-tac-toe', description: 'Official React tutorial that teaches you React by building a tic-tac-toe game.', type: 'documentation', source: 'React.dev' },
                { phase: 'Phase 3', title: 'Scrimba — Learn React for Free', url: 'https://scrimba.com/learn/learnreact', description: 'Interactive screencasts teaching React concepts hands-on in the browser.', type: 'course', source: 'Scrimba' },
                // Phase 4: Backend Development
                { phase: 'Phase 4', title: 'Node.js Official Getting Started Guide', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', description: 'Official Node.js documentation with guides on HTTP servers, file system, and more.', type: 'documentation', source: 'Node.js' },
                { phase: 'Phase 4', title: 'freeCodeCamp — Back End Development and APIs', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', description: 'Build microservices, manage packages with npm, and create REST APIs with Express.', type: 'course', source: 'freeCodeCamp' },
                // Phase 5: Full Stack Projects
                { phase: 'Phase 5', title: 'The Odin Project — Full Stack Path', url: 'https://www.theodinproject.com/paths/full-stack-javascript', description: 'Complete open-source full-stack curriculum with real-world projects.', type: 'course', source: 'The Odin Project' },
                { phase: 'Phase 5', title: 'Vercel — Deployment Documentation', url: 'https://vercel.com/docs', description: 'Learn to deploy your full-stack applications for free with Vercel.', type: 'documentation', source: 'Vercel' },
            ]},

            // ==================== ARTIFICIAL INTELLIGENCE ====================
            { domain: 'artificial intelligence', refs: [
                // Phase 1: Python & Math Foundations
                { phase: 'Phase 1', title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', description: 'The official Python tutorial — from basics to data structures and modules.', type: 'documentation', source: 'Python.org' },
                { phase: 'Phase 1', title: 'Khan Academy — Linear Algebra', url: 'https://www.khanacademy.org/math/linear-algebra', description: 'Free linear algebra course essential for understanding ML algorithms.', type: 'course', source: 'Khan Academy' },
                { phase: 'Phase 1', title: 'NumPy Official Getting Started', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html', description: 'NumPy fundamentals for absolute beginners — arrays, operations, and more.', type: 'documentation', source: 'NumPy' },
                // Phase 2: Data Analysis & Visualization
                { phase: 'Phase 2', title: 'Kaggle Learn — Pandas', url: 'https://www.kaggle.com/learn/pandas', description: 'Hands-on micro-course for learning Pandas data manipulation.', type: 'course', source: 'Kaggle' },
                { phase: 'Phase 2', title: 'Kaggle Learn — Data Visualization', url: 'https://www.kaggle.com/learn/data-visualization', description: 'Learn Seaborn for creating informative statistical graphics.', type: 'course', source: 'Kaggle' },
                // Phase 3: Machine Learning
                { phase: 'Phase 3', title: 'Coursera — Machine Learning by Andrew Ng', url: 'https://www.coursera.org/learn/machine-learning', description: 'The legendary free ML course from Stanford. Covers supervised/unsupervised learning, best practices.', type: 'course', source: 'Coursera' },
                { phase: 'Phase 3', title: 'Scikit-learn Official Tutorials', url: 'https://scikit-learn.org/stable/tutorial/index.html', description: 'Official scikit-learn tutorials covering classification, regression, and clustering.', type: 'documentation', source: 'scikit-learn' },
                { phase: 'Phase 3', title: 'Google — Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', description: 'Google\'s fast-paced intro to ML with TensorFlow exercises.', type: 'course', source: 'Google Developers' },
                // Phase 4: Deep Learning
                { phase: 'Phase 4', title: 'TensorFlow Official Tutorials', url: 'https://www.tensorflow.org/tutorials', description: 'Step-by-step TensorFlow tutorials for beginners and experts.', type: 'documentation', source: 'TensorFlow' },
                { phase: 'Phase 4', title: '3Blue1Brown — Neural Networks', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi', description: 'Beautiful visual explanations of neural networks and deep learning.', type: 'video', source: 'YouTube' },
                // Phase 5: AI Projects & Research
                { phase: 'Phase 5', title: 'Kaggle Competitions', url: 'https://www.kaggle.com/competitions', description: 'Participate in real ML competitions to build your portfolio.', type: 'tool', source: 'Kaggle' },
                { phase: 'Phase 5', title: 'Papers With Code', url: 'https://paperswithcode.com/', description: 'Browse ML papers alongside their code implementations and benchmarks.', type: 'tool', source: 'Papers With Code' },
            ]},

            // ==================== CLOUD COMPUTING ====================
            { domain: 'cloud computing', refs: [
                // Phase 1: Linux & Networking
                { phase: 'Phase 1', title: 'Linux Journey', url: 'https://linuxjourney.com/', description: 'Free, interactive lessons teaching Linux from beginner to advanced.', type: 'course', source: 'Linux Journey' },
                { phase: 'Phase 1', title: 'Networking Fundamentals — Cisco', url: 'https://www.netacad.com/courses/networking/networking-basics', description: 'Cisco\'s free networking basics course covering TCP/IP, DNS, and more.', type: 'course', source: 'Cisco NetAcad' },
                // Phase 2: Cloud Platform Fundamentals
                { phase: 'Phase 2', title: 'AWS Cloud Practitioner Essentials', url: 'https://explore.skillbuilder.aws/learn/course/external/view/elearning/134/aws-cloud-practitioner-essentials', description: 'Free official AWS course covering cloud concepts, services, and architecture.', type: 'course', source: 'AWS Skill Builder' },
                { phase: 'Phase 2', title: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/', description: 'Free labs and courses for learning Google Cloud Platform.', type: 'course', source: 'Google Cloud' },
                // Phase 3: Cloud Architecture
                { phase: 'Phase 3', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html', description: 'Best practices for designing cloud architectures that are reliable, scalable, and cost-effective.', type: 'documentation', source: 'AWS' },
                { phase: 'Phase 3', title: 'AWS Lambda Getting Started', url: 'https://docs.aws.amazon.com/lambda/latest/dg/getting-started.html', description: 'Official guide to serverless computing with AWS Lambda.', type: 'documentation', source: 'AWS' },
                // Phase 4: Containers & Orchestration
                { phase: 'Phase 4', title: 'Docker Official Getting Started', url: 'https://docs.docker.com/get-started/', description: 'Official Docker tutorial from installation to multi-container apps.', type: 'documentation', source: 'Docker' },
                { phase: 'Phase 4', title: 'Kubernetes Official Tutorials', url: 'https://kubernetes.io/docs/tutorials/', description: 'Learn Kubernetes basics, deploy apps, and configure clusters.', type: 'documentation', source: 'Kubernetes' },
                // Phase 5: DevOps & Deployment
                { phase: 'Phase 5', title: 'Terraform Learn — Getting Started', url: 'https://developer.hashicorp.com/terraform/tutorials', description: 'Official HashiCorp tutorials for Infrastructure as Code with Terraform.', type: 'course', source: 'HashiCorp' },
                { phase: 'Phase 5', title: 'Prometheus Documentation', url: 'https://prometheus.io/docs/introduction/overview/', description: 'Learn monitoring and alerting with Prometheus.', type: 'documentation', source: 'Prometheus' },
            ]},

            // ==================== DEVOPS ====================
            { domain: 'devops', refs: [
                // Phase 1: Version Control & Git
                { phase: 'Phase 1', title: 'Git Official Book — Pro Git', url: 'https://git-scm.com/book/en/v2', description: 'The entire Pro Git book available free online. From basics to advanced workflows.', type: 'documentation', source: 'Git' },
                { phase: 'Phase 1', title: 'GitHub Skills', url: 'https://skills.github.com/', description: 'Interactive courses to learn GitHub features like Actions, Pages, and collaboration.', type: 'course', source: 'GitHub' },
                { phase: 'Phase 1', title: 'Atlassian Git Tutorials', url: 'https://www.atlassian.com/git/tutorials', description: 'Comprehensive Git tutorials covering branching strategies and workflows.', type: 'article', source: 'Atlassian' },
                // Phase 2: Containerization
                { phase: 'Phase 2', title: 'Docker Official Getting Started', url: 'https://docs.docker.com/get-started/', description: 'Docker\'s official step-by-step guide to containerization.', type: 'documentation', source: 'Docker' },
                { phase: 'Phase 2', title: 'Docker Compose Getting Started', url: 'https://docs.docker.com/compose/gettingstarted/', description: 'Learn to define multi-container applications with Docker Compose.', type: 'documentation', source: 'Docker' },
                // Phase 3: CI/CD Pipelines
                { phase: 'Phase 3', title: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions', description: 'Official guide to automating workflows with GitHub Actions.', type: 'documentation', source: 'GitHub' },
                { phase: 'Phase 3', title: 'Jenkins Official Tutorials', url: 'https://www.jenkins.io/doc/tutorials/', description: 'Step-by-step Jenkins pipeline tutorials.', type: 'documentation', source: 'Jenkins' },
                // Phase 4: Orchestration & Infra
                { phase: 'Phase 4', title: 'Kubernetes Official Tutorials', url: 'https://kubernetes.io/docs/tutorials/', description: 'Learn Kubernetes fundamentals with interactive tutorials.', type: 'documentation', source: 'Kubernetes' },
                { phase: 'Phase 4', title: 'Terraform Learn Tutorials', url: 'https://developer.hashicorp.com/terraform/tutorials', description: 'HashiCorp\'s official IaC tutorials with hands-on labs.', type: 'course', source: 'HashiCorp' },
                // Phase 5: Monitoring & SRE
                { phase: 'Phase 5', title: 'Google SRE Book (Free)', url: 'https://sre.google/sre-book/table-of-contents/', description: 'Google\'s complete Site Reliability Engineering book — available free online.', type: 'article', source: 'Google SRE' },
                { phase: 'Phase 5', title: 'Grafana Tutorials', url: 'https://grafana.com/tutorials/', description: 'Learn monitoring dashboards and observability with Grafana.', type: 'course', source: 'Grafana' },
            ]},

            // ==================== CYBERSECURITY ====================
            { domain: 'cybersecurity', refs: [
                // Phase 1: Networking & Linux
                { phase: 'Phase 1', title: 'TryHackMe — Pre-Security Path', url: 'https://tryhackme.com/path/outline/presecurity', description: 'Free introductory path covering networking, Linux, and web fundamentals.', type: 'course', source: 'TryHackMe' },
                { phase: 'Phase 1', title: 'Nmap Official Documentation', url: 'https://nmap.org/book/', description: 'The complete guide to network scanning with Nmap.', type: 'documentation', source: 'Nmap' },
                // Phase 2: Cryptography & Security
                { phase: 'Phase 2', title: 'Crypto101 — Free Cryptography Book', url: 'https://www.crypto101.io/', description: 'Free introductory book on modern cryptography concepts.', type: 'article', source: 'Crypto101' },
                { phase: 'Phase 2', title: 'Khan Academy — Cryptography', url: 'https://www.khanacademy.org/computing/computer-science/cryptography', description: 'Free visual lessons on encryption, ciphers, and key exchange.', type: 'course', source: 'Khan Academy' },
                // Phase 3: Ethical Hacking
                { phase: 'Phase 3', title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', description: 'The most critical web application security risks you must know.', type: 'documentation', source: 'OWASP' },
                { phase: 'Phase 3', title: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', description: 'Free, hands-on web security training with interactive labs.', type: 'course', source: 'PortSwigger' },
                { phase: 'Phase 3', title: 'TryHackMe — Complete Beginner Path', url: 'https://tryhackme.com/path/outline/beginner', description: 'Guided path through hacking fundamentals with virtual labs.', type: 'course', source: 'TryHackMe' },
                // Phase 4: Advanced Attacks & Defense
                { phase: 'Phase 4', title: 'Hack The Box Academy', url: 'https://academy.hackthebox.com/', description: 'Structured cybersecurity learning with hands-on labs and challenges.', type: 'course', source: 'Hack The Box' },
                { phase: 'Phase 4', title: 'MITRE ATT&CK Framework', url: 'https://attack.mitre.org/', description: 'Knowledge base of adversary tactics and techniques for threat modeling.', type: 'tool', source: 'MITRE' },
                // Phase 5: CTF & Certifications
                { phase: 'Phase 5', title: 'picoCTF — Beginner CTF Platform', url: 'https://picoctf.org/', description: 'Free beginner-friendly Capture The Flag challenges from Carnegie Mellon.', type: 'tool', source: 'picoCTF' },
                { phase: 'Phase 5', title: 'Professor Messer — CompTIA Security+', url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/', description: 'Free video course covering the CompTIA Security+ certification.', type: 'video', source: 'Professor Messer' },
            ]},

            // ==================== MOBILE DEVELOPMENT ====================
            { domain: 'mobile development', refs: [
                // Phase 1: Programming Fundamentals
                { phase: 'Phase 1', title: 'Dart Language Tour', url: 'https://dart.dev/language', description: 'Official Dart language tutorial covering all fundamentals.', type: 'documentation', source: 'Dart.dev' },
                { phase: 'Phase 1', title: 'Kotlin Official Documentation', url: 'https://kotlinlang.org/docs/getting-started.html', description: 'Learn Kotlin from scratch with official tutorials and examples.', type: 'documentation', source: 'Kotlin' },
                // Phase 2: UI Development
                { phase: 'Phase 2', title: 'Flutter Official Codelabs', url: 'https://docs.flutter.dev/codelabs', description: 'Guided, hands-on coding tutorials for building Flutter apps.', type: 'course', source: 'Flutter' },
                { phase: 'Phase 2', title: 'Android Developers — UI Guide', url: 'https://developer.android.com/develop/ui', description: 'Official Android UI development guides with Jetpack Compose.', type: 'documentation', source: 'Android' },
                { phase: 'Phase 2', title: 'Material Design 3 Guidelines', url: 'https://m3.material.io/', description: 'Google\'s design system for building beautiful, usable apps.', type: 'documentation', source: 'Material Design' },
                // Phase 3: APIs & Data
                { phase: 'Phase 3', title: 'Flutter Cookbook — Networking', url: 'https://docs.flutter.dev/cookbook/networking', description: 'Official Flutter recipes for fetching data, JSON parsing, and WebSockets.', type: 'documentation', source: 'Flutter' },
                { phase: 'Phase 3', title: 'Android Developers — Room Database', url: 'https://developer.android.com/training/data-storage/room', description: 'Official guide to local data persistence with Room.', type: 'documentation', source: 'Android' },
                // Phase 4: Advanced Features
                { phase: 'Phase 4', title: 'Firebase Documentation', url: 'https://firebase.google.com/docs', description: 'Complete Firebase guides for auth, databases, cloud messaging, and more.', type: 'documentation', source: 'Firebase' },
                { phase: 'Phase 4', title: 'Flutter — Adding Firebase', url: 'https://firebase.google.com/docs/flutter/setup', description: 'Step-by-step guide to integrate Firebase with your Flutter app.', type: 'documentation', source: 'Firebase' },
                // Phase 5: Publishing & Beyond
                { phase: 'Phase 5', title: 'Play Console — Launch Checklist', url: 'https://developer.android.com/distribute/best-practices/launch/launch-checklist', description: 'Official checklist for publishing your app on Google Play.', type: 'article', source: 'Android' },
                { phase: 'Phase 5', title: 'Codemagic CI/CD for Mobile', url: 'https://docs.codemagic.io/', description: 'Free CI/CD tool built specifically for mobile app deployment.', type: 'tool', source: 'Codemagic' },
            ]},
        ];

        let totalInserted = 0;
        for (const entry of seedData) {
            const domainId = domainMap[entry.domain];
            if (!domainId) {
                console.log(`⚠ Domain "${entry.domain}" not found, skipping`);
                continue;
            }

            for (const ref of entry.refs) {
                await db.query(
                    'INSERT INTO learning_references (domain_id, phase, title, url, description, type, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [domainId, ref.phase, ref.title, ref.url, ref.description, ref.type, ref.source]
                );
                totalInserted++;
            }
            console.log(`✓ Seeded ${entry.refs.length} references for "${entry.domain}"`);
        }

        console.log(`\n✅ Migration complete! Inserted ${totalInserted} references.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
