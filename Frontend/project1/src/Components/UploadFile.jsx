//function of this component
//1 Upload a File(excel,pdf,image)
//2 Store file in React state
//3 Send it to backend server using axios
//4 Show success or error messages
import React from 'react'
import { useState } from 'react'
import axios from 'axios';

const UploadFile = () => {
  const [selectedFile, setSelectedFile] = useState(null);   
  const [statusMessage, setStatusMessage] = useState("");   
  const [isUploading, setIsUploading] = useState(false);    

   const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setStatusMessage(""); // Clear old messages
   };

    const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage("❌ Please select a file first.");
      return;
    }
     const formData = new FormData();
    formData.append("file", selectedFile); 

     try {
      setIsUploading(true);
      const response = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setStatusMessage(`✅ ${response.data.message}`);
      setSelectedFile(null);
     }
      catch (error) {
      console.error("Upload error:", error);
      setStatusMessage("❌ Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }; // Clear file from state after successful upload
  return (
     <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 text-center">
        Upload Financial Document
      </h2>

      <input
        type="file"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className={`w-full py-2 px-4 rounded text-white ${
          isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>

      {statusMessage && (
        <p className={`text-center ${statusMessage.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
  
}

export default UploadFile;