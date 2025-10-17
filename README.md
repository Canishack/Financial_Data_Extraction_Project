# 📊 Financial Data Extraction & Analysis Tool  

> An intelligent web application to **extract and analyze key financial data** from documents and text.  
This tool combines **OCR + Generative AI** to transform **unstructured financial reports, invoices, and articles** into **structured, actionable insights**.  

---

## ✨ Features  

- 📄 **Multi-Format Upload** – Process `.pdf`, `.png`, `.jpg`, `.jpeg` files  
- 🤖 **Automated OCR** – Extracts text with **Tesseract.js**  
- ✍️ **Interactive Text Editor** – Manually refine extracted text  
- 🧠 **AI-Powered Analysis** – Uses **Google Generative AI** → outputs **JSON metrics**  
- 🚀 **Cloud-Native** – Backend on **Firebase Functions**, frontend on **Firebase Hosting**  
- 📱 **Responsive UI** – Modern React design for desktop & mobile  

---

## 🛠️ Tech Stack  

| Layer         | Technology |
|---------------|------------|
| **Frontend**  | React, Axios, React Router |
| **Backend**   | Node.js, Express.js |
| **AI & OCR**  | Google Generative AI, Tesseract.js |
| **Deployment**| Firebase Hosting + Cloud Functions |

---

## 📂 Project Structure  

```bash
/
├── Frontend/         # React.js client app
│   ├── public/
│   └── src/
└── Backend/          # Node.js/Express.js server + Cloud Functions
    ├── routes/
    └── index.js

## ⚙️ Local Development  

### 🔑 Prerequisites  
- Node.js (v18+)  
- npm  
- Google API Key (with *Generative Language API* enabled)  

1️⃣ Clone Repository
git clone https://github.com/Canishack/Financial_Data_Extraction_Project.git
cd Financial_Data_Extraction_Project

2️⃣ Backend Setup
cd Backend
npm install
touch key.env


Inside key.env:

GOOGLE_API_KEY=YOUR_API_KEY_HERE

3️⃣ Frontend Setup
cd ../Frontend
npm install

4️⃣ Run Application
Backend (Terminal 1)
cd Backend
npm start
Runs → http://localhost:5000

Frontend (Terminal 2)

cd Frontend

npm start

Opens → http://localhost:3000

🌍 Deployment (Firebase)

Install Firebase CLI

npm install -g firebase-tools


**Login & Initialize**
firebase login
firebase init

(select Hosting + Functions)

Build Frontend

cd Frontend
npm run build


Deploy

firebase deploy
