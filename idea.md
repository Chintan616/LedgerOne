# InvoiceFlow - Cloud-Based Invoice & Accounting SaaS

## Project Overview

InvoiceFlow is a cloud-based Software-as-a-Service (SaaS) platform designed for freelancers, consultants, agencies, and small business owners to manage clients, generate professional invoices, track payments, record expenses, and monitor business profitability from a centralized dashboard.

The platform follows a Microservices Architecture using Spring Boot and modern backend technologies such as Kafka, Redis, Docker, API Gateway, and Service Discovery.

The goal is to simplify financial management while demonstrating scalable backend system design.

---

# Problem Statement

Many freelancers and small businesses still rely on spreadsheets and manual bookkeeping to manage invoices and expenses.

Common problems include:

* Missed invoice payments
* Poor revenue visibility
* Lack of expense tracking
* No automated reminders
* Time-consuming invoice creation

InvoiceFlow solves these problems through automation and centralized financial management.

---

# Target Users

* Freelancers
* Software Developers
* Designers
* Consultants
* Digital Agencies
* Coaches and Tutors
* Small Business Owners

---

# System Architecture

Microservices:

1. Auth Service
2. Invoice Service
3. Accounting Service
4. Notification Service

Infrastructure Components:

* API Gateway
* Eureka Service Discovery
* Kafka Message Broker
* Upstash Redis Cache

---

# Service 1: Auth Service

## Responsibilities

* User Registration
* User Login
* JWT Authentication
* Refresh Token Management
* Password Encryption
* Logout

## Features

### Register

User creates account using:

* Full Name
* Email
* Password

### Login

System validates credentials and generates:

* Access Token
* Refresh Token

### Logout

Invalidates active refresh token.

---

# Service 2: Invoice Service

## Responsibilities

* Client Management
* Invoice Management
* PDF Generation
* Payment Tracking
* Overdue Detection (Scheduled Job)

## Overdue Detection

A scheduled job runs daily inside the Invoice Service. It queries all invoices where status = SENT and due_date < today, updates their status to OVERDUE, and publishes an invoice-overdue event to Kafka for each one.

---

## Client Management

Users can:

* Create Client
* Update Client
* Delete Client
* View Client History

Client Information:

* Name
* Company Name
* Email
* Phone Number
* Address
* GST Number

---

## Invoice Management

Users can:

* Create Invoice
* Edit Invoice
* Delete Invoice
* View Invoice
* Download PDF

Invoice Contains:

* Invoice Number
* Client Details
* Issue Date
* Due Date
* Invoice Items
* GST
* Total Amount

---

## Invoice Status

* Draft
* Sent
* Paid
* Overdue

---

## PDF Generation

System generates professional invoices in PDF format.

Example:

Invoice #INV-1001

Client: ABC Pvt Ltd

Website Development: ₹20,000

Hosting: ₹5,000

GST: ₹4,500

Total: ₹29,500

---

# Service 3: Accounting Service

## Responsibilities

* Expense Management
* Revenue Tracking
* Profit Calculation
* Financial Reporting
* Dashboard Analytics

---

## Expense Management

Users can record expenses.

Categories:

* Rent
* Internet
* Marketing
* Travel
* Software Subscription
* Miscellaneous

Expense Example:

Internet Bill: ₹1,000

Hosting Charges: ₹2,500

Office Rent: ₹10,000

---

## Revenue Tracking

Revenue is automatically calculated from paid invoices.

---

## Profit Calculation

Profit = Revenue - Expenses

---

## Financial Reports

Generate:

* Monthly Reports
* Yearly Reports
* Custom Date Range Reports

Metrics:

* Revenue
* Expenses
* Profit
* Pending Invoices
* Paid Invoices

---

# Service 4: Notification Service

## Responsibilities

* Email Delivery
* Reminder Scheduling
* Event Processing

---

## Notifications

### Invoice Sent

Email invoice to client.

### Due Date Reminder

Reminder sent before payment deadline.

### Overdue Reminder

Reminder sent when invoice becomes overdue.

### Payment Received

Notify user when payment is received.

---

# Event Driven Architecture

Kafka Topics

---

invoice-created

Produced By:

Invoice Service

Consumed By:

* Notification Service
* Accounting Service

---

invoice-paid

Produced By:

Invoice Service

Consumed By:

* Notification Service
* Accounting Service

---

invoice-overdue

Produced By:

Invoice Service

Consumed By:

* Notification Service

---

expense-created

Produced By:

Accounting Service

Consumed By:

* Accounting Service (invalidates dashboard Redis cache)

---

# Redis Caching Strategy

Provider:

Upstash Redis

---

## Dashboard Cache

Cache Key:

dashboard:user:{userId}

Stores:

* Revenue
* Expenses
* Profit
* Pending Invoices

TTL:

10 Minutes

---

## Invoice Cache

Cache Key:

invoice:{invoiceId}

Stores frequently viewed invoice data.

---

## Cache Invalidation

When:

* Invoice Updated
* Invoice Paid
* Expense Added

Related cache entries are removed and rebuilt.

Pattern Used:

Cache Aside Pattern

---

# API Gateway

Responsibilities:

* Single Entry Point
* Request Routing
* JWT Validation
* Rate Limiting

Routes:

/auth/**

/invoices/**

/accounting/**

/notifications/**

---

# Service Discovery

Eureka Server

Responsibilities:

* Dynamic Service Registration
* Service Discovery
* Load Balancing Support

---

# Database Design

## Auth Database

users

* id
* name
* email
* password
* created_at

refresh_tokens

* id
* token
* expiry_date
* user_id

---

## Invoice Database

clients

* id
* user_id (FK → users.id)
* name
* company_name
* email
* phone

invoices

* id
* user_id (FK → users.id)
* invoice_number
* client_id
* issue_date
* due_date
* status
* total_amount

invoice_items

* id
* invoice_id
* description
* quantity
* unit_price

---

## Accounting Database

expenses

* id
* user_id (FK → users.id)
* title
* category
* amount
* expense_date

Note: Revenue, expenses, and profit are derived at query time from paid invoices and expense records. No financial_summary table — running totals stored in a table create concurrency bugs under concurrent writes. The Redis dashboard cache handles the fast read path.

---

# Application Pages

## Authentication

* Login
* Register

---

## Dashboard

Displays:

* Total Revenue
* Total Expenses
* Net Profit
* Pending Invoices
* Overdue Invoices

Charts:

* Revenue Trend
* Expense Trend
* Profit Trend

---

## Clients

* Client List
* Create Client
* Edit Client
* Delete Client

---

## Invoices

* Invoice List
* Create Invoice
* Edit Invoice
* Delete Invoice
* Download PDF
* Mark Paid

---

## Expenses

* Add Expense
* Edit Expense
* Delete Expense
* Expense History

---

## Reports

* Monthly Reports
* Yearly Reports
* Custom Reports
* Export CSV
* Export PDF

---

## Profile

* Update User Information
* Change Password

---

# Security Features

* Spring Security
* JWT Authentication
* Refresh Tokens
* BCrypt Password Encryption
* Global Exception Handling
* Request Validation

---

# Communication Strategy

All inter-service communication is asynchronous via Kafka. The API Gateway validates JWT tokens, so no service needs to call Auth Service directly.

## Asynchronous (Kafka)

* Invoice created/paid/overdue → Notification Service sends emails
* Invoice paid → Accounting Service updates revenue figures and invalidates dashboard cache
* Expense created → Accounting Service invalidates dashboard cache

Kafka event payloads carry all necessary data (userId, clientName, amount, etc.) so consuming services never need to call back to the producer.

---

# Technology Stack

Backend

* Java 21 (LTS)
* Spring Boot

Security

* Spring Security
* JWT

Database

* MySQL

ORM

* Spring Data JPA
* Hibernate

Microservices

* Spring Cloud Gateway
* Eureka Server

Messaging

* Apache Kafka

Caching

* Upstash Redis

Deployment

* Docker
* Docker Compose






# ui - minimalism , should look professional , light themed
