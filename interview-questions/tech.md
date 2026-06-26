# Technology Choices for LedgerOne

This document explains **why** you chose specific technologies for LedgerOne. Use these points during your interview to show that you made deliberate, thoughtful engineering decisions.

---

## 1. Frontend
*   **React:** I chose React because it allows me to build a dynamic, Single Page Application (SPA) using reusable components. It has a massive ecosystem and is an industry standard for modern web apps.
*   **Vite:** I used Vite instead of Create React App because it is incredibly fast. It provides instant server start and lightning-fast Hot Module Replacement (HMR), which sped up my development time significantly.
*   **Tailwind CSS:** I wanted to style components quickly without jumping back and forth between CSS files. Tailwind’s utility classes made it easy to build a clean, responsive UI very fast.
*   **Recharts:** For the dashboard, I needed a charting library that was easy to integrate with React. Recharts is highly customizable and uses React components directly, making it perfect for visualizing income and expenses.

## 2. Main Backend
*   **Java & Spring Boot:** I chose Spring Boot because it provides a robust, enterprise-grade foundation for building REST APIs. It handles a lot of the heavy lifting like dependency injection, security, and database connections (via Spring Data JPA) out of the box.
*   **PostgreSQL:** Since this is a financial application (invoices, expenses, billing), data integrity is critical. PostgreSQL is a highly reliable relational database that perfectly handles structured, interconnected data.
*   **Redis:** Calculating the dashboard summaries requires aggregating a lot of database rows. I introduced Redis to cache these calculations (Cache-Aside pattern). This prevents heavy SQL queries on every page load and gives the user near-instant dashboard loads.
*   **JWT (JSON Web Tokens):** I used JWT for stateless authentication. It allows the backend to verify users without storing session data in memory, making the app more scalable.
*   **Apache PDFBox:** I needed a way to generate professional invoices programmatically. PDFBox is a mature and powerful Java library that let me draw text, lines, and shapes to create pixel-perfect PDF documents.

## 3. AI Service (Microservice)
*   **Python & FastAPI:** Python is the undisputed king of AI and machine learning libraries. I used FastAPI because it is extremely lightweight, fast, and perfect for creating a small, dedicated microservice.
*   **LangChain & OpenAI:** I wanted users to be able to ask questions about their data in plain English. LangChain provided the framework to build an "Agent" that can take a user's question, figure out which database query to run, and use OpenAI's language models to return a helpful answer.

## 4. DevOps & Deployment
*   **Docker & Docker Compose:** I used Docker to containerize the Java backend and the Python AI service. This ensures that the application runs exactly the same way on my local machine as it does on a production server. Docker Compose makes it easy to spin up both services together with one command.
