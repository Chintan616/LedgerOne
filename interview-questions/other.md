# Potential Interview Questions for LedgerOne

Here are some common questions an interviewer might ask about your project, along with simple answers you can use to prepare.

---

### 1. What was the most challenging part of building this project?
**How to answer:** Pick one technical challenge. A great example is cache invalidation.
*   **Sample Answer:** "The hardest part was making sure the dashboard data was always accurate while using Redis. If a user created a new invoice, I had to ensure the old cached dashboard data was cleared immediately. Managing those cache evictions correctly took some careful testing."

### 2. Why did you build the AI Service in Python instead of adding it to the Java backend?
**How to answer:** Talk about using the right tool for the job.
*   **Sample Answer:** "I wanted to use LangChain and OpenAI for the AI assistant. Python has the best support and libraries for AI development. Using FastAPI allowed me to spin up a small, fast microservice quickly rather than trying to force AI libraries into my Java Spring Boot backend."

### 3. How did you handle security and user login?
**How to answer:** Mention JWT and OAuth.
*   **Sample Answer:** "I used stateless JWT (JSON Web Tokens) for security. When a user logs in, they get an access token and a refresh token. I also integrated Google OAuth2, so users can log in securely using their Google accounts without needing to remember a new password."

### 4. How does the automatic 'overdue' invoice detection work?
**How to answer:** Explain the Spring Scheduler.
*   **Sample Answer:** "I used Spring Scheduler in my Java backend. I created a job that runs every night at midnight. It checks the database for any invoices that have a status of 'SENT' and where the due date has passed. It then automatically updates their status to 'OVERDUE'."

### 5. How do you make sure one user can't see another user's invoices?
**How to answer:** Explain data isolation.
*   **Sample Answer:** "Every important table in my PostgreSQL database, like Invoices and Clients, has a `user_email` column. Whenever the backend or the AI service queries the database, it always filters the data using the logged-in user's email from their JWT token. This guarantees data privacy."

### 6. Why did you use Redis, and what is the 'Cache-Aside' pattern?
**How to answer:** Explain the performance benefit.
*   **Sample Answer:** "Calculating dashboard summaries requires heavy database queries. I used Redis to store these results. In the 'Cache-Aside' pattern, the app checks Redis first. If the data is there, it returns it instantly. If not, it fetches from PostgreSQL, saves it in Redis for next time, and then returns it to the user."

### 7. How did you generate the PDF invoices?
**How to answer:** Mention the Java library.
*   **Sample Answer:** "I used Apache PDFBox on the backend. When a user requests a PDF, the server pulls their business profile and client data, and programmatically draws the text and invoice tables onto a blank PDF document before sending it to the frontend."

### 8. How do the frontend and backend talk to each other?
**How to answer:** Mention the API setup.
*   **Sample Answer:** "The React frontend uses Axios to make HTTP requests to my Spring Boot REST API. I set up CORS (Cross-Origin Resource Sharing) on the backend so it safely accepts requests from the frontend, and every request includes the JWT token in the header for authentication."

---
**Tip:** You don't need to memorize these word-for-word. Just understand the main idea behind each answer so you can explain it naturally!
