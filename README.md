# ⚖️ Adilet — AI Legal Assistant for Kazakhstani Youth

**Adilet** is a modern web platform designed to make legal aid accessible, confidential, and empathetic for young people in Kazakhstan facing domestic violence, psychological pressure, or labor rights violations.

---

## 🚀 Project Concept & Scope
The platform combines three core pillars to deliver immediate and reliable assistance:
1. **AI Consultant**: An interactive chatbot utilizing an exclusive local knowledge base drawn from official Kazakhstani legislation (Labor Code, Code on Marriage and Family, and Domestic Violence Prevention laws).
2. **Free Student Consultations**: A dedicated marketplace connecting users with 1st-4th year law students for real-time peer consultations, helping students gain practical experience while supporting those in need.
3. **User Cases Hub ("My Requests")**: A secure space where registered users (who can use pseudonyms for maximum safety) can track their conversation history with both the AI and student counselors.

---

## 🛠️ Technical Stack
* **Framework**: Next.js 14 (App Router) with TypeScript
* **Styling**: Tailwind CSS (Fully responsive, minimalist design with custom theme settings)
* **Dev Environment**: Cursor & GitHub

---

## 📈 MVP Architecture (Current Implementation)
* `src/app/page.tsx`: The main user interface, including a clean Navigation Bar, Language Toggle (Рус | Қаз), interactive AI input with quick-start templates, and a dynamic student consultant grid.
* `src/app/api/ask/route.ts`: A server-side API endpoint that processes user inputs against our localized legal database to return a structured 3-step action plan, exact law article references, and vital legal disclaimers.
* `src/knowledge-base.json`: A strictly compiled local dataset ensuring the AI generates answers based solely on verified legal documents without external hallucinations.

---

### 🏃 How to Run Locally

1. Clone the repository, install dependencies, and start the local server:
   ```bash
   git clone [https://github.com/samirusham-dotcom/adiletstart.git](https://github.com/samirusham-dotcom/adiletstart.git)
   cd adiletstart
   npm install
   echo "ANTHROPIC_API_KEY=your_actual_api_key_here" > .env.local
   npm run dev
