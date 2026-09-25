// aiService.js — Reusable AI service for all tools
// Supports OpenAI, Gemini, and Demo Mode

'use strict';

const axios = require('axios');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Read env vars fresh at call time so changes/restarts always take effect */
function getConfig() {
  return {
    demoMode: process.env.DEMO_MODE === 'true',
    provider: (process.env.AI_PROVIDER || 'openai').toLowerCase(),
    apiKey: (process.env.AI_API_KEY || '').trim(),
    model: (process.env.AI_MODEL || 'gpt-3.5-turbo').trim()
  };
}

/**
 * Strip markdown code fences that some models add around JSON, then parse.
 * Tries multiple extraction strategies before giving up.
 */
function parseJSON(raw) {
  // 1. Direct parse (model returned clean JSON)
  try { return JSON.parse(raw); } catch (_) {}

  // 2. Strip ```json … ``` or ``` … ``` fences
  const fenceStripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  try { return JSON.parse(fenceStripped); } catch (_) {}

  // 3. Find the first { … } or [ … ] block in the string
  const start = raw.search(/[{[]/);
  const end   = Math.max(raw.lastIndexOf('}'), raw.lastIndexOf(']'));
  if (start !== -1 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) {}
  }

  throw new Error('AI returned invalid JSON. Please try regenerating.');
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

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

  notes: `# Introduction to Machine Learning\n\n## What is Machine Learning?\nMachine Learning (ML) is a subset of Artificial Intelligence (AI) that enables systems to **learn from data** and improve their performance without being explicitly programmed.\n\n> **Key Idea:** Instead of writing rules manually, we feed data to an algorithm and let it discover patterns.\n\n---\n\n## Types of Machine Learning\n\n### 1. Supervised Learning\n- The model learns from **labeled data** (input → output pairs).\n- **Examples:** Email spam detection, image classification, house price prediction.\n- **Algorithms:** Linear Regression, Decision Trees, SVM, Neural Networks.\n\n### 2. Unsupervised Learning\n- The model finds **hidden patterns** in unlabeled data.\n- **Examples:** Customer segmentation, anomaly detection, topic modeling.\n- **Algorithms:** K-Means Clustering, PCA, Autoencoders.\n\n### 3. Reinforcement Learning\n- An agent learns by **interacting with an environment** and receiving rewards/penalties.\n- **Examples:** Game-playing AI, robotics, self-driving cars.\n\n---\n\n## 📝 Exam Tips\n- Supervised vs Unsupervised: **labeled vs unlabeled data**\n- Overfitting solution: **more data, regularization, dropout**`,

  ppt: {
    presentationTitle: "Introduction to Artificial Intelligence",
    slides: [
      { title: "What is Artificial Intelligence?", bullets: ["AI simulates human intelligence in machines", "Enables computers to learn, reason, and problem-solve", "Key capabilities: perception, language, decision-making", "Founded as a field in 1956 at Dartmouth Conference"] },
      { title: "Types of AI", bullets: ["Narrow AI: designed for specific tasks (Siri, Chess)", "General AI: human-level across all domains (theoretical)", "Super AI: surpasses human intelligence (future concept)", "Most current AI is Narrow AI"] },
      { title: "Machine Learning", bullets: ["Subset of AI: systems learn from data without explicit programming", "Supervised: learns from labeled input-output pairs", "Unsupervised: finds patterns in unlabeled data", "Reinforcement: learns through rewards and penalties"] }
    ]
  },

  mindmap: {
    title: "Artificial Intelligence",
    children: [
      { title: "Machine Learning", children: [{ title: "Supervised Learning", children: [] }, { title: "Unsupervised Learning", children: [] }] },
      { title: "Deep Learning", children: [{ title: "Neural Networks", children: [] }, { title: "Transformers", children: [] }] },
      { title: "Applications", children: [{ title: "Healthcare", children: [] }, { title: "Finance", children: [] }] }
    ]
  },

  explanation: "This is a fundamental concept in computer science and artificial intelligence. It involves algorithms that enable systems to learn patterns from data, make decisions, and improve performance over time without being explicitly programmed for each task.",

  quiz: {
    title: "Machine Learning Quiz",
    questions: [
      { question: "What is Machine Learning?", options: ["A type of hardware", "A subset of AI that learns from data", "A programming language", "A database system"], correct: 1, explanation: "Machine Learning is a subset of AI that enables systems to learn from data without being explicitly programmed." },
      { question: "Which learning type uses labeled data?", options: ["Unsupervised Learning", "Reinforcement Learning", "Supervised Learning", "Transfer Learning"], correct: 2, explanation: "Supervised Learning uses labeled input-output pairs to train models." }
    ]
  },

  'doubt-solver': "Supervised learning is a type of machine learning where the model learns from **labeled training data**. Each training example consists of an input and a corresponding correct output (label).\n\n**How it works:**\n1. You provide the model with many input-output pairs\n2. The model finds patterns that map inputs to outputs\n3. It then predicts outputs for new, unseen inputs",

  flashcards: {
    title: "Machine Learning Flashcards",
    cards: [
      { question: "What is Machine Learning?", answer: "Machine Learning is a branch of AI that enables systems to learn from data and improve performance without being explicitly programmed." },
      { question: "What is Overfitting?", answer: "Overfitting occurs when a model performs very well on training data but poorly on new/test data because it memorizes rather than generalizes." }
    ]
  },

  'study-planner': {
    title: "Weekly Study Plan",
    schedule: [
      { day: "Monday", sessions: [{ start: "18:00", end: "19:30", subject: "AI", topic: "Neural Networks", activity: "Study" }] },
      { day: "Tuesday", sessions: [{ start: "18:00", end: "19:30", subject: "DBMS", topic: "Normalization", activity: "Study" }] }
    ]
  },

  summarizer: {
    extractedText: "Natural Language Processing (NLP) is a subfield of linguistics, computer science, and artificial intelligence...",
    summary: "## Summary\nNatural Language Processing (NLP) is a field combining linguistics, computer science, and AI that focuses on enabling computers to understand, process, and generate human language.\n\n## Key Terms\n- **NLP** — Natural Language Processing\n- **Speech Recognition** — Converting spoken words to text"
  }
};

// ─── AI Provider Calls ────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt, userPrompt, model, apiKey) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 90000
    }
  );
  return response.data.choices[0].message.content;
}

async function callGemini(systemPrompt, userPrompt, model, apiKey) {
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
    },
    { timeout: 90000 }
  );
  return response.data.candidates[0].content.parts[0].text;
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────

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

// ─── JSON tools (must return parsed objects) ──────────────────────────────────
const JSON_TOOLS = new Set(['resume', 'ppt', 'mindmap', 'quiz', 'flashcards', 'study-planner']);

// ─── Main Service Function ────────────────────────────────────────────────────

async function processAIRequest(tool, payload) {
  const { demoMode, provider, apiKey, model } = getConfig();

  // Demo mode — return realistic sample data
  if (demoMode || !apiKey || apiKey === 'your_openai_api_key_here') {
    console.log(`[AI Service] Demo mode active (DEMO_MODE=${demoMode}, hasKey=${!!apiKey})`);
    await new Promise(r => setTimeout(r, 800)); // simulate network latency
    const demoResult = demoData[tool];
    if (demoResult !== undefined) {
      return { success: true, data: demoResult, demo: true };
    }
    return { success: true, data: demoData.explanation, demo: true };
  }

  console.log(`[AI Service] Live mode — provider=${provider} model=${model} tool=${tool}`);

  let systemPrompt, userPrompt;

  switch (tool) {
    case 'resume':
      ({ systemPrompt, userPrompt } = buildResumePrompt(payload));
      break;
    case 'notes':
      ({ systemPrompt, userPrompt } = buildNotesPrompt(payload.content, payload.style));
      break;
    case 'ppt':
      ({ systemPrompt, userPrompt } = buildPPTPrompt(
        payload.topic, payload.slides, payload.audience, payload.level, payload.instructions
      ));
      break;
    case 'mindmap':
      ({ systemPrompt, userPrompt } = buildMindMapPrompt(payload.content));
      break;
    case 'explain':
      ({ systemPrompt, userPrompt } = buildExplainPrompt(payload.topic));
      break;
    case 'quiz':
      ({ systemPrompt, userPrompt } = buildQuizPrompt(payload.topic, payload.count || 5, payload.difficulty || 'Medium'));
      break;
    case 'doubt-solver':
      ({ systemPrompt, userPrompt } = buildDoubtSolverPrompt(payload.subject, payload.prompt, payload.history));
      break;
    case 'flashcards':
      ({ systemPrompt, userPrompt } = buildFlashcardsPrompt(payload.topic, payload.material, payload.count || 8, payload.difficulty || 'Medium'));
      break;
    case 'study-planner':
      ({ systemPrompt, userPrompt } = buildStudyPlannerPrompt(
        payload.subjects, payload.studyHours, payload.startTime,
        payload.endTime, payload.studyDays, payload.weakTopics
      ));
      break;
    case 'summarizer':
      ({ systemPrompt, userPrompt } = buildSummarizerPrompt(payload.text));
      break;
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }

  let rawResponse;
  const callFn = provider === 'gemini'
    ? () => callGemini(systemPrompt, userPrompt, model, apiKey)
    : () => callOpenAI(systemPrompt, userPrompt, model, apiKey);

  // Retry up to 3 times with exponential backoff on 429
  const retryDelays = [8000, 20000, 40000];
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      rawResponse = await callFn();
      break;
    } catch (err) {
      const status = err.response?.status;
      const errData = err.response?.data?.error?.message || err.message;
      console.error(`[AI Service] Attempt ${attempt} error: status=${status}`, errData);

      if (status === 401) throw new Error('Invalid API key. Please check your AI_API_KEY in .env');
      if (status === 503) throw new Error('OpenAI is temporarily unavailable. Please try again shortly.');
      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') throw new Error('Request timed out. The AI took too long to respond.');
      if (err.code === 'ENOTFOUND') throw new Error('Cannot reach the AI service. Check your internet connection.');

      if (status === 429) {
        // Honour Retry-After header if present
        const retryAfter = err.response?.headers?.['retry-after'];
        const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelays[attempt - 1];
        if (attempt < 3) {
          console.log(`[AI Service] Rate limited — waiting ${wait / 1000}s before retry ${attempt + 1}...`);
          await new Promise(r => setTimeout(r, wait));
          continue;
        }
        throw new Error('Rate limit exceeded. Please wait 1–2 minutes and try again.');
      }

      throw new Error(`AI service error: ${errData || 'Please try again.'}`);
    }
  }

  // For tools expecting JSON: parse and validate
  if (JSON_TOOLS.has(tool)) {
    const parsed = parseJSON(rawResponse);
    return { success: true, data: parsed, demo: false };
  }

  return { success: true, data: rawResponse, demo: false };
}

module.exports = { processAIRequest };
