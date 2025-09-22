# Buddy
# Pet Adoption Website (Backend)

A backend server for a Pet Adoption Website, built with Node.js and Express.js. This project manages pet listings, adoption requests, and email notifications using Nodemailer.

---

## Features

- **Pet Management:** Add, update, delete, and view pets available for adoption.
- **Adoption Requests:** Users can submit requests to adopt a pet.
- **Email Notifications:** Sends email confirmations to users using **Nodemailer**.
- **RESTful API:** Provides endpoints for all backend operations.
- **JSON Data Handling:** All data is handled in JSON format.
  
---

## Technologies Used

- **Node.js** – Backend runtime  
- **Express.js** – Web framework for building APIs  
- **MongoDB / MySQL / (Your DB)** – Database to store pet and user data  
- **Nodemailer** – For sending email notifications  
- **dotenv** – For environment variable management  
- **Body-parser / Express.json()** – For parsing request bodies  

---

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pet-adoption-backend.git
cd pet-adoption-backend
2. Install dependencies:
npm install
3.Start the server:
npm start

API Endpoints
Pets

GET /pets – Get all pets
GET /pets/:id – Get a specific pet
POST /pets – Add a new pet
PUT /pets/:id – Update a pet
DELETE /pets/:id – Delete a pet

Adoption Requests
POST /adoptions – Submit a new adoption request (triggers email confirmation)

Email Notifications

The backend uses Nodemailer to send email confirmations when a user submits an adoption request. Make sure your .env contains valid email credentials.
