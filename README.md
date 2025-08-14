# 📊 Financial Data Extraction System

A full-stack web application that extracts **structured, tabular financial data** from PDFs using OCR and AI-powered parsing, designed for **high throughput and low latency**.

## 🚀 Features
- Upload financial documents in PDF format
- Extract structured data (tables, text) using **Tesseract.js** and **OpenAI API**
- RESTful API endpoints for file upload and data retrieval
- Real-time extraction status updates
- Stores extracted data in **MongoDB** for easy querying
- Fully responsive **React.js** frontend
- Modular backend architecture for scalability

---

## 🛠 Tech Stack
**Frontend:** React.js, HTML5, CSS3  
**Backend:** Node.js, Express.js  
**Database:** MongoDB  
**OCR:** Tesseract.js, pdf-parse  
**AI Processing:** OpenAI API  
**Tools & Deployment:** Git, Docker, Postman, VS Code

---

## 📂 Project Structure
├── client/ # React frontend
├── server/ # Node.js backend
│ ├── routes/ # API endpoints
│ ├── controllers/ # Business logic
│ ├── models/ # MongoDB schemas
│ ├── utils/ # OCR & AI helpers
├── .env # Environment variables
├── package.json
├── README.md


---

## ⚡ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Canishack/Financial_Data_Extraction_Project.git
   cd Financial_Data_Extraction_Project


Install dependencies

cd server && npm install
cd ../client && npm install


Set environment variables
Create a .env file in the server folder:


OPENAI_API_KEY=your_openai_key
PORT=5000


Run the application

Start backend:

cd server && npm start


Start frontend:

cd client && npm start
