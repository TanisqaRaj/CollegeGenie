// aiService.js — Reusable AI service for all 4 tools
// Supports OpenAI, Gemini, and Demo Mode

const axios = require('axios');

const DEMO_MODE = process.env.DEMO_MODE === 'true';
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

// ─── Demo Data ──────────────────────────────────────────────────────────────

const demoData = {
  resume: {
    personal: {
      name: "Arjun Sharma",
      email: "arjun.sharma@email.com",
      phone: "+91 98765 43210",
      location: "Bangalore, Karnataka",
      linkedin: "linkedin.com/in/arjunsharma",
      github: "github.com/arjunsharma",
      portfolio: "arjunsharma.dev"
    },
    summary: "Motivated Computer Science student with hands-on experience in full-stack web development and machine learning. Passionate about building scalable applications and solving real-world problems through technology. Seeking opportunities to apply technical skills in a challenging environment.",
    education: [
      {
        degree: "B.Tech Computer Science and Engineering",
        college: "RV College of Engineering",
        location: "Bangalore, Karnataka",
        startYear: "2021",
        endYear: "2025",
        cgpa: "8.7"
      }
    ],
    skills: {
      languages: ["Python", "JavaScript", "Java", "C++"],
      technologies: ["React", "Node.js", "Express", "MongoDB", "MySQL"],
      tools: ["Git", "Docker", "Figma", "VS Code", "Postman"],
      softSkills: ["Team Leadership", "Problem Solving", "Communication", "Time Management"]
    },
    experience: [
      {
        company: "TechCorp Solutions",
        role: "Software Development Intern",
        duration: "May 2024 – July 2024",
        responsibilities: [
          "Developed RESTful APIs using Node.js and Express, improving response time by 30%.",
          "Collaborated with a cross-functional team of 8 to deliver features on schedule.",
          "Wrote unit tests using Jest, increasing code coverage from 60% to 85%."
        ]
      }
    ],
    projects: [
      {
        name: "SmartExpense — AI-Powered Expense Tracker",
        technologies: "React, Node.js, MongoDB, Python, ML",
        description: "A full-stack expense tracking application with AI-powered spending insights.",
        contributions: [
          "Built a machine learning model to categorize expenses with 92% accuracy.",
          "Designed and implemented a responsive React dashboard with real-time charts.",
          "Deployed the application on AWS EC2 with CI/CD using GitHub Actions."
        ]
      },
      {
        name: "CampusConnect — College Social Platform",
        technologies: "HTML, CSS, JavaScript, Firebase",
        description: "A real-time social platform for college students to share resources and events.",
        contributions: [
          "Implemented real-time messaging using Firebase Realtime Database.",
          "Designed the UI/UX with Figma and implemented it using vanilla JavaScript.",
          "Onboarded 200+ students within the first week of launch."
        ]
      }
    ],
    certifications: [
      { name: "AWS Cloud Practitioner", organization: "Amazon Web Services", year: "2024" },
      { name: "Machine Learning Specialization", organization: "Coursera / DeepLearning.AI", year: "2023" }
    ],
    achievements: [
      "1st Place — National Level Hackathon, TechFest 2024 (500+ participants).",
      "Google Summer of Code 2024 participant — contributed to open-source ML library.",
      "Academic Excellence Award — Top 5% of batch, 2022 and 2023."
    ]
  },

  notes: `# Introduction to Machine Learning

## What is Machine Learning?
Machine Learning (ML) is a subset of Artificial Intelligence (AI) that enables systems to **learn from data** and improve their performance without being explicitly programmed.

> **Key Idea:** Instead of writing rules manually, we feed data to an algorithm and let it discover patterns.

---

## Types of Machine Learning

### 1. Supervised Learning
- The model learns from **labeled data** (input → output pairs).
- **Examples:** Email spam detection, image classification, house price prediction.
- **Algorithms:** Linear Regression, Decision Trees, SVM, Neural Networks.

### 2. Unsupervised Learning
- The model finds **hidden patterns** in unlabeled data.
- **Examples:** Customer segmentation, anomaly detection, topic modeling.
- **Algorithms:** K-Means Clustering, PCA, Autoencoders.

### 3. Reinforcement Learning
- An agent learns by **interacting with an environment** and receiving rewards/penalties.
- **Examples:** Game-playing AI, robotics, self-driving cars.
- **Key Concepts:** Agent, Environment, State, Action, Reward.

---

## Important Terminology

| Term | Definition |
|------|-----------|
| **Feature** | An input variable used for prediction |
| **Label** | The output variable (in supervised learning) |
| **Training Data** | Data used to train the model |
| **Test Data** | Data used to evaluate the model |
| **Overfitting** | Model performs well on training data but poorly on new data |
| **Underfitting** | Model is too simple to capture patterns |

---

## The ML Workflow

1. **Data Collection** — Gather relevant data
2. **Data Preprocessing** — Clean, normalize, handle missing values
3. **Feature Engineering** — Select/create meaningful features
4. **Model Selection** — Choose appropriate algorithm
5. **Training** — Fit model to training data
6. **Evaluation** — Measure accuracy, precision, recall, F1
7. **Deployment** — Serve the model in production

---

## 📝 Exam Tips
- Supervised vs Unsupervised: **labeled vs unlabeled data**
- Overfitting solution: **more data, regularization, dropout**
- Bias-Variance tradeoff: **high bias = underfitting, high variance = overfitting**`,

  ppt: {
    presentationTitle: "Introduction to Artificial Intelligence",
    slides: [
      {
        title: "What is Artificial Intelligence?",
        bullets: [
          "AI is the simulation of human intelligence in machines",
          "Enables computers to perform tasks that typically require human cognition",
          "Key capabilities: learning, reasoning, problem-solving, perception",
          "Founded as a field in 1956 at Dartmouth Conference"
        ]
      },
      {
        title: "Types of AI",
        bullets: [
          "Narrow AI (Weak AI): Designed for specific tasks — e.g., Siri, Chess engines",
          "General AI (Strong AI): Human-level intelligence across all domains (theoretical)",
          "Super AI: Surpasses human intelligence in all areas (future concept)",
          "Most current AI systems are Narrow AI"
        ]
      },
      {
        title: "Machine Learning",
        bullets: [
          "Subset of AI: systems learn from data without explicit programming",
          "Supervised Learning: learns from labeled input-output pairs",
          "Unsupervised Learning: finds patterns in unlabeled data",
          "Reinforcement Learning: learns through rewards and penalties"
        ]
      },
      {
        title: "Deep Learning & Neural Networks",
        bullets: [
          "Subset of ML inspired by the human brain's neural structure",
          "Composed of layers of interconnected nodes (neurons)",
          "Excels at image recognition, speech, and natural language processing",
          "Requires large datasets and significant computational power"
        ]
      },
      {
        title: "Real-World Applications",
        bullets: [
          "Healthcare: Medical image diagnosis, drug discovery",
          "Finance: Fraud detection, algorithmic trading",
          "Transportation: Autonomous vehicles, route optimization",
          "Entertainment: Recommendation systems (Netflix, Spotify)"
        ]
      },
      {
        title: "Challenges & Ethics",
        bullets: [
          "Bias in training data leads to unfair model outcomes",
          "Privacy concerns with large-scale data collection",
          "Lack of explainability in black-box models",
          "Job displacement and socioeconomic impact"
        ]
      },
      {
        title: "The Future of AI",
        bullets: [
          "Multimodal AI: combining text, images, audio, and video",
          "AI Agents: autonomous systems that take real-world actions",
          "Edge AI: running models on devices without cloud dependency",
          "Human-AI collaboration will define the next decade of work"
        ]
      }
    ]
  },

  mindmap: {
    title: "Artificial Intelligence",
    children: [
      {
        title: "Machine Learning",
        children: [
          { title: "Supervised Learning", children: [{ title: "Classification", children: [] }, { title: "Regression", children: [] }] },
          { title: "Unsupervised Learning", children: [{ title: "Clustering", children: [] }, { title: "Dimensionality Reduction", children: [] }] },
          { title: "Reinforcement Learning", children: [{ title: "Q-Learning", children: [] }, { title: "Policy Gradient", children: [] }] }
        ]
      },
      {
        title: "Deep Learning",
        children: [
          { title: "Neural Networks", children: [{ title: "CNN", children: [] }, { title: "RNN", children: [] }] },
          { title: "Transformers", children: [{ title: "BERT", children: [] }, { title: "GPT", children: [] }] }
        ]
      },
      {
        title: "Natural Language Processing",
        children: [
          { title: "Text Classification", children: [] },
          { title: "Named Entity Recognition", children: [] },
          { title: "Machine Translation", children: [] }
        ]
      },
      {
        title: "Computer Vision",
        children: [
          { title: "Image Recognition", children: [] },
          { title: "Object Detection", children: [] },
          { title: "Image Segmentation", children: [] }
        ]
      },
      {
        title: "Applications",
        children: [
          { title: "Healthcare", children: [] },
          { title: "Finance", children: [] },
          { title: "Autonomous Vehicles", children: [] }
        ]
      }
    ]
  },

  explanation: "This is a fundamental concept in computer science and artificial intelligence. It involves algorithms that enable systems to learn patterns from data, make decisions, and improve performance over time without being explicitly programmed for each task. Understanding this topic is essential for modern software development and data science careers.",

  quiz: {
    title: "Machine Learning Quiz",
    questions: [
      { question: "What is Machine Learning?", options: ["A type of hardware", "A subset of AI that learns from data", "A programming language", "A database system"], correct: 1, explanation: "Machine Learning is a subset of AI that enables systems to learn from data without being explicitly programmed." },
      { question: "Which learning type uses labeled data?", options: ["Unsupervised Learning", "Reinforcement Learning", "Supervised Learning", "Transfer Learning"], correct: 2, explanation: "Supervised Learning uses labeled input-output pairs to train models." },
      { question: "What does 'overfitting' mean?", options: ["Model is too simple", "Model performs well only on training data", "Model has no parameters", "Model trains too fast"], correct: 1, explanation: "Overfitting occurs when a model memorizes training data and fails to generalize to new data." },
      { question: "Which algorithm is used for classification?", options: ["K-Means", "Linear Regression", "PCA", "Decision Tree"], correct: 3, explanation: "Decision Trees are commonly used for classification tasks." },
      { question: "What is a neural network?", options: ["A computer virus", "A biological brain model", "A computational model inspired by brain neurons", "A type of database"], correct: 2, explanation: "Neural networks are computational models inspired by biological neurons in the human brain." }
    ]
  },

  'doubt-solver': "Supervised learning is a type of machine learning where the model learns from **labeled training data**. Each training example consists of an input and a corresponding correct output (label).\n\n**How it works:**\n1. You provide the model with many input-output pairs\n2. The model finds patterns that map inputs to outputs\n3. It then predicts outputs for new, unseen inputs\n\n**Real-world examples:**\n- Email spam detection (spam / not spam)\n- Image classification (cat / dog)\n- House price prediction\n\n**Key algorithms:** Linear Regression, Logistic Regression, Decision Trees, SVM, Neural Networks\n\n**Exam tip:** Supervised learning = labeled data = teacher showing examples to a student.",

  flashcards: {
    title: "Machine Learning Flashcards",
    cards: [
      { question: "What is Machine Learning?", answer: "Machine Learning is a branch of AI that enables systems to learn from data and improve performance without being explicitly programmed." },
      { question: "What is Supervised Learning?", answer: "Supervised learning uses labeled training data (input-output pairs) to train a model to predict outputs for new inputs." },
      { question: "What is Unsupervised Learning?", answer: "Unsupervised learning finds hidden patterns in unlabeled data without any predefined outputs. Examples: clustering, dimensionality reduction." },
      { question: "What is Overfitting?", answer: "Overfitting occurs when a model performs very well on training data but poorly on new/test data because it memorizes rather than generalizes." },
      { question: "What is a Neural Network?", answer: "A computational model inspired by biological neurons. It consists of layers of nodes that process data to recognize patterns." },
      { question: "What is the Bias-Variance Tradeoff?", answer: "High bias = underfitting (model too simple). High variance = overfitting (model too complex). The goal is to find the right balance." },
      { question: "What is a Training Set?", answer: "The subset of data used to train/fit the machine learning model." },
      { question: "What is Cross-Validation?", answer: "A technique to evaluate model performance by splitting data into multiple train/test folds to reduce overfitting." }
    ]
  },

  'study-planner': {
    title: "Weekly Study Plan",
    schedule: [
      { day: "Monday", sessions: [{ start: "18:00", end: "19:30", subject: "AI", topic: "Neural Networks", activity: "Study" }, { start: "19:45", end: "21:00", subject: "DBMS", topic: "Normalization", activity: "Study" }] },
      { day: "Tuesday", sessions: [{ start: "18:00", end: "19:30", subject: "AI", topic: "Revision — Neural Networks", activity: "Revision" }, { start: "19:45", end: "21:15", subject: "Computer Networks", topic: "TCP/IP Model", activity: "Study" }] },
      { day: "Wednesday", sessions: [{ start: "18:00", end: "19:00", subject: "DBMS", topic: "SQL Queries", activity: "Practice" }, { start: "19:15", end: "20:45", subject: "AI", topic: "Search Algorithms", activity: "Study" }] },
      { day: "Thursday", sessions: [{ start: "18:00", end: "19:30", subject: "Computer Networks", topic: "Routing Protocols", activity: "Study" }, { start: "19:45", end: "21:00", subject: "DBMS", topic: "Mock Test", activity: "Revision" }] },
      { day: "Friday", sessions: [{ start: "18:00", end: "19:30", subject: "AI", topic: "Mock Test", activity: "Revision" }, { start: "19:45", end: "20:45", subject: "Computer Networks", topic: "Revision", activity: "Revision" }] },
      { day: "Saturday", sessions: [{ start: "10:00", end: "12:00", subject: "All Subjects", topic: "Full Revision", activity: "Revision" }, { start: "14:00", end: "16:00", subject: "AI", topic: "Previous Year Questions", activity: "Practice" }] },
      { day: "Sunday", sessions: [{ start: "10:00", end: "11:30", subject: "DBMS", topic: "Previous Year Questions", activity: "Practice" }, { start: "11:45", end: "13:00", subject: "Computer Networks", topic: "Previous Year Questions", activity: "Practice" }] }
    ]
  },

  summarizer: {
    extractedText: "Natural Language Processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence concerned with the interactions between computers and human language, in particular how to program computers to process and analyze large amounts of natural language data. The goal is a computer capable of understanding the contents of documents, including the contextual nuances of the language within them. The technology can then accurately extract information and insights contained in the documents, as well as categorize and organize the documents themselves. Challenges in natural language processing frequently involve speech recognition, natural language understanding, and natural language generation.",
    summary: "## Summary\nNatural Language Processing (NLP) is a field combining linguistics, computer science, and AI that focuses on enabling computers to understand, process, and generate human language.\n\n## Important Points\n- NLP allows computers to process and analyze large amounts of natural language data\n- Goal: computers that understand documents including contextual nuances\n- Can extract information, categorize, and organize documents\n- Key challenges: speech recognition, language understanding, and generation\n\n## Key Terms\n- **NLP** — Natural Language Processing\n- **Speech Recognition** — Converting spoken words to text\n- **Natural Language Understanding** — Comprehending meaning from text\n- **Natural Language Generation** — Producing human-readable text from data\n\n## Exam-Focused Points\n- NLP = intersection of linguistics + CS + AI\n- Three main tasks: recognition → understanding → generation\n- Applications: chatbots, translation, sentiment analysis, summarization"
  }
};

// ─── AI Call ─────────────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt, userPrompt) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    },
    {
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  return response.data.choices[0].message.content;
}

async function callGemini(systemPrompt, userPrompt) {
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:generateContent?key=${AI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
    },
    { timeout: 60000 }
  );
  return response.data.candidates[0].content.parts[0].text;
}

// ─── Tool Prompts ─────────────────────────────────────────────────────────────

function buildResumePrompt(data) {
  const systemPrompt = `You are a professional resume writer. Your job is to improve the grammar, language, and presentation of the resume data provided. 
CRITICAL RULES:
- NEVER invent, add, or fabricate any degree, college, company, experience, skill, certification, or achievement.
- Only improve existing language: make it professional, concise, and ATS-friendly.
- Use strong action verbs for responsibilities.
- Convert responsibilities into concise bullet points.
- Return ONLY valid JSON matching the exact schema provided. No markdown, no explanation, just JSON.`;

  const userPrompt = `Improve the following resume data and return it as valid JSON with this exact structure:
{
  "personal": { "name":"","email":"","phone":"","location":"","linkedin":"","github":"","portfolio":"" },
  "summary": "",
  "education": [{"degree":"","college":"","location":"","startYear":"","endYear":"","cgpa":""}],
  "skills": { "languages":[],"technologies":[],"tools":[],"softSkills":[] },
  "experience": [{"company":"","role":"","duration":"","responsibilities":[]}],
  "projects": [{"name":"","technologies":"","description":"","contributions":[]}],
  "certifications": [{"name":"","organization":"","year":""}],
  "achievements": []
}

Input data:
${JSON.stringify(data, null, 2)}`;

  return { systemPrompt, userPrompt };
}

function buildNotesPrompt(content, style) {
  const styleGuide = {
    short: 'Create concise short notes with key points only. Use bullet points and brief definitions.',
    detailed: 'Create comprehensive detailed notes with explanations, examples, and context.',
    exam: 'Create exam-focused notes with key terms bolded, important formulas, and memory tips.'
  };

  const systemPrompt = `You are an expert academic tutor. Convert study material into well-structured notes in Markdown format.
Style: ${styleGuide[style] || styleGuide.detailed}
Rules:
- Use proper Markdown headings (##, ###)
- Use bullet points and numbered lists
- Bold important terms
- Include definitions, key points, and examples from the source material
- Do not add facts not present in the source unless clearly labeled as additional context
- Return only Markdown, no extra commentary`;

  const userPrompt = `Convert this study material into ${style} notes:\n\n${content}`;
  return { systemPrompt, userPrompt };
}

function buildPPTPrompt(topic, slides, audience, level, instructions) {
  const systemPrompt = `You are an expert presentation creator. Create a professional slide presentation.
Return ONLY valid JSON — no markdown, no explanation, just the JSON object.
Each slide must have a "title" (string) and "bullets" (array of 3-5 strings).`;

  const userPrompt = `Create a ${slides}-slide presentation on: "${topic}"
Audience: ${audience || 'College students'}
Level: ${level || 'Intermediate'}
Additional instructions: ${instructions || 'None'}

Return this exact JSON structure:
{
  "presentationTitle": "...",
  "slides": [
    { "title": "...", "bullets": ["...", "...", "..."] }
  ]
}`;

  return { systemPrompt, userPrompt };
}

function buildMindMapPrompt(content) {
  const systemPrompt = `You are an expert at organizing information into hierarchical structures.
Convert the provided syllabus or topic list into a mind map JSON structure.
Return ONLY valid JSON — no markdown, no explanation.
Keep node titles concise (1-5 words max).`;

  const userPrompt = `Convert this content into a hierarchical mind map JSON:

${content}

Return this exact JSON structure:
{
  "title": "Main Topic",
  "children": [
    {
      "title": "Subtopic 1",
      "children": [
        { "title": "Leaf 1", "children": [] },
        { "title": "Leaf 2", "children": [] }
      ]
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

function buildExplainPrompt(topic) {
  const systemPrompt = `You are a helpful academic tutor. Explain topics clearly and concisely for college students.`;
  const userPrompt = `Explain "${topic}" in 3-5 sentences suitable for a college student. Be clear, accurate, and educational.`;
  return { systemPrompt, userPrompt };
}

function buildQuizPrompt(topic, count, difficulty) {
  const systemPrompt = `You are an expert quiz creator for college students. Return ONLY valid JSON — no markdown, no explanation.`;
  const userPrompt = `Create a ${count}-question multiple choice quiz on "${topic}" at ${difficulty} difficulty.
Return this exact JSON:
{
  "title": "...",
  "questions": [
    { "question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "..." }
  ]
}
"correct" is the 0-based index of the correct option. Each question must have exactly 4 options.`;
  return { systemPrompt, userPrompt };
}

function buildDoubtSolverPrompt(subject, question, history) {
  const systemPrompt = `You are a friendly, knowledgeable academic tutor helping a college student with ${subject}.
Rules:
- Explain concepts simply and clearly
- Use examples and analogies
- Break complex topics into numbered steps
- Give exam-friendly explanations where appropriate
- Do not invent facts
- If the question is unclear, ask for clarification
- Keep responses focused and concise (under 400 words)
- Use markdown formatting: bold key terms, use bullet points, numbered steps`;

  const historyText = (history || []).map(h => `Student: ${h.q}\nTutor: ${h.a}`).join('\n\n');
  const userPrompt = historyText
    ? `Previous conversation:\n${historyText}\n\nStudent's new question: ${question}`
    : question;
  return { systemPrompt, userPrompt };
}

function buildFlashcardsPrompt(topic, material, count, difficulty) {
  const systemPrompt = `You are an expert educator creating study flashcards. Return ONLY valid JSON — no markdown, no explanation.`;
  const userPrompt = `Create ${count} flashcards for the topic "${topic}" at ${difficulty} difficulty level.
${material ? `Use this study material as the basis:\n${material}\n` : ''}
Return this exact JSON:
{
  "title": "...",
  "cards": [
    { "question": "...", "answer": "..." }
  ]
}
Make questions clear and answers concise but complete.`;
  return { systemPrompt, userPrompt };
}

function buildStudyPlannerPrompt(subjects, studyHours, startTime, endTime, studyDays, weakTopics) {
  const systemPrompt = `You are an expert academic study planner. Create realistic, balanced study timetables.
Rules:
- Give more sessions to high-priority subjects and subjects with closer exams
- Include 15-minute breaks between sessions
- Never overlap sessions
- Stay within the student's available study hours
- Include revision sessions before exams
- Return ONLY valid JSON — no markdown, no explanation`;

  const userPrompt = `Create a weekly study plan with this information:
Subjects: ${JSON.stringify(subjects)}
Daily study hours: ${studyHours}
Study time window: ${startTime} to ${endTime}
Study days: ${studyDays.join(', ')}
Weak topics: ${weakTopics || 'None specified'}

Return this exact JSON:
{
  "title": "Weekly Study Plan",
  "schedule": [
    {
      "day": "Monday",
      "sessions": [
        { "start": "18:00", "end": "19:30", "subject": "...", "topic": "...", "activity": "Study|Revision|Practice" }
      ]
    }
  ]
}
Only include the study days provided.`;
  return { systemPrompt, userPrompt };
}

function buildSummarizerPrompt(text) {
  const systemPrompt = `You are an expert academic summarizer. Summarize study notes clearly and concisely in Markdown format.`;
  const userPrompt = `Summarize these notes and return in Markdown with these exact sections:

## Summary
(2-4 sentence overview)

## Important Points
(bullet points of key facts)

## Key Terms
(bolded terms with short definitions)

## Exam-Focused Points
(what a student must remember for exams)

Notes to summarize:
${text}`;
  return { systemPrompt, userPrompt };
}

// ─── Main Service Function ────────────────────────────────────────────────────

async function processAIRequest(tool, payload) {
  // Demo mode — return realistic sample data
  if (DEMO_MODE || !AI_API_KEY || AI_API_KEY === 'your_openai_api_key_here') {
    await new Promise(r => setTimeout(r, 1200)); // simulate delay
    const demoResult = demoData[tool];
    if (demoResult !== undefined) {
      return { success: true, data: demoResult, demo: true };
    }
    return { success: true, data: demoData.explanation, demo: true };
  }

  let systemPrompt, userPrompt;

  switch (tool) {
    case 'resume': {
      ({ systemPrompt, userPrompt } = buildResumePrompt(payload));
      break;
    }
    case 'notes': {
      ({ systemPrompt, userPrompt } = buildNotesPrompt(payload.content, payload.style));
      break;
    }
    case 'ppt': {
      ({ systemPrompt, userPrompt } = buildPPTPrompt(
        payload.topic, payload.slides, payload.audience, payload.level, payload.instructions
      ));
      break;
    }
    case 'mindmap': {
      ({ systemPrompt, userPrompt } = buildMindMapPrompt(payload.content));
      break;
    }
    case 'explain': {
      ({ systemPrompt, userPrompt } = buildExplainPrompt(payload.topic));
      break;
    }
    case 'quiz': {
      ({ systemPrompt, userPrompt } = buildQuizPrompt(payload.topic, payload.count || 5, payload.difficulty || 'Medium'));
      break;
    }
    case 'doubt-solver': {
      ({ systemPrompt, userPrompt } = buildDoubtSolverPrompt(payload.subject, payload.prompt, payload.history));
      break;
    }
    case 'flashcards': {
      ({ systemPrompt, userPrompt } = buildFlashcardsPrompt(payload.topic, payload.material, payload.count || 8, payload.difficulty || 'Medium'));
      break;
    }
    case 'study-planner': {
      ({ systemPrompt, userPrompt } = buildStudyPlannerPrompt(payload.subjects, payload.studyHours, payload.startTime, payload.endTime, payload.studyDays, payload.weakTopics));
      break;
    }
    case 'summarizer': {
      ({ systemPrompt, userPrompt } = buildSummarizerPrompt(payload.text));
      break;
    }
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }

  let rawResponse;
  try {
    if (AI_PROVIDER === 'gemini') {
      rawResponse = await callGemini(systemPrompt, userPrompt);
    } else {
      rawResponse = await callOpenAI(systemPrompt, userPrompt);
    }
  } catch (err) {
    if (err.response?.status === 401) throw new Error('Invalid API key. Please check your AI_API_KEY in .env');
    if (err.response?.status === 429) throw new Error('Rate limit exceeded. Please wait and try again.');
    if (err.code === 'ECONNABORTED') throw new Error('Request timed out. The AI took too long to respond.');
    throw new Error('AI service unavailable. Please try again.');
  }

  // For tools expecting JSON, parse and validate
  if (['resume', 'ppt', 'mindmap', 'quiz', 'flashcards', 'study-planner'].includes(tool)) {
    try {
      const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, data: parsed, demo: false };
    } catch {
      throw new Error('AI returned invalid JSON. Please try regenerating.');
    }
  }

  return { success: true, data: rawResponse, demo: false };
}

module.exports = { processAIRequest };
