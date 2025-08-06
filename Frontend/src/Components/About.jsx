import React from 'react'

import './About.css'

const About = () => {
    return (
        <div className='container2'>

            <div className="container3">
                <h1 className='about'>About Us..</h1>
                <hr />
                
                <p className='abt'>This project, titled Financial Data Extraction System, is a full-stack web application designed to help users upload, store, and analyze financial documents like PDFs, Excel files, and images. The frontend is built using React.js, offering a clean and responsive interface for users to select and upload files. The uploaded file is managed in the React state and sent to a Node.js backend via Axios using a multipart/form-data POST request.

                    The backend, developed using Express.js, handles file uploads using Multer, a middleware for handling multipart form data. The system provides real-time upload status (loading, success, or error) to the user. Though the file is currently stored locally for simplicity, the architecture is designed to be extended for saving metadata and extracted content to MongoDB Atlas using Mongoose.

                    The long-term goal of the project is to integrate OCR (Optical Character Recognition) tools (like Tesseract.js) and OpenAI’s API to extract meaningful financial data—such as summaries, figures, and insights—from the uploaded files. This makes the application particularly useful for accountants, analysts, and finance professionals who need a quick way to digitize and interpret scanned or digital financial documents. The system prioritizes simplicity, extensibility, and real-world relevance for interviews or deployment.</p>
            </div>
        </div>
    )
}

export default About