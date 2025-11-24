import React, { useState, useRef } from 'react';
import axios from 'axios';
import './UploadFile.css';
import { useNavigate } from 'react-router-dom';
import JsonPrettyDisplay from './Dashboard/JsonPrettyDisplay';

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const UploadFile = ({ setExtractedData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTextContent, setCurrentTextContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const textEditorRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setCurrentTextContent('');
    setStatusMessage('');
    setAnalysisResult(null);
  };

  const handleTextEditorChange = (e) => {
    setCurrentTextContent(e.target.value);
    setSelectedFile(null);
    setStatusMessage('');
    setAnalysisResult(null);
  };

  const handleProcessInput = async () => {
    if (!selectedFile && !currentTextContent) {
      setStatusMessage('❌ Please upload a file OR paste article text to process.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('⏳ Processing content...');
    setAnalysisResult(null);

    try {
      if (selectedFile) {
        setStatusMessage('⏳ Uploading file and performing OCR...');
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await axios.post(`${API_BASE}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const extracted = res.data.extractedText || '';
        setCurrentTextContent(extracted);
        setStatusMessage(extracted ? '✅ File uploaded and text extracted!' : '⚠️ Uploaded but no text extracted.');

      } else {
        setStatusMessage('✅ Article text ready for analysis!');
      }

      if (textEditorRef.current) textEditorRef.current.scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
      setStatusMessage(`❌ Processing failed: ${err.response?.data?.message || err.message}`);
      setCurrentTextContent('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!currentTextContent) {
      setStatusMessage('❌ Please provide text in the editor to analyze.');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('⏳ Analyzing text with LLM...');
    setAnalysisResult(null);

    try {
      const res = await axios.post(`${API_BASE}/api/analyze`, {
        articleText: currentTextContent,
      });

      setAnalysisResult(res.data);
      setExtractedData(res.data);
      setStatusMessage('✅ Analysis complete! Scroll down and click Visualize.');

    } catch (err) {
      setStatusMessage(`❌ Analysis failed: ${err.response?.data?.message || err.message}`);
      setAnalysisResult({ error: err.response?.data?.message || err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = () => {
    if (textEditorRef.current) {
      textEditorRef.current.select();
      document.execCommand('copy');
      setStatusMessage('✅ Text copied to clipboard!');
      setTimeout(() => setStatusMessage(''), 2000);
    }
  };

  const goToDashboard = () => {
    if (!analysisResult) {
      setStatusMessage('⚠️ Run Analyze before visualizing.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="main-content-wrapper">
      <div className="input-column">
        <div className="upload-container">
          <h2 className="upload-title">📄 Upload Financial Document</h2>
          <div className="button-group">
            <label className="glow-button file-label">
              Choose File
              <input type="file" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.txt" className="hidden-input" />
            </label>

            <button className="glow-button" onClick={handleProcessInput} disabled={isProcessing || (!selectedFile && !currentTextContent)}>
              {isProcessing ? 'Processing...' : 'Process Content'}
            </button>
          </div>

          {selectedFile && <p className="selected-file">📎 Selected File: <strong>{selectedFile.name}</strong></p>}
        </div>

        <div className="text-editor-section">
          <h3 className="text-editor-title">📝 Article Text Editor</h3>
          <textarea ref={textEditorRef} className="text-editor-area" value={currentTextContent} onChange={handleTextEditorChange} placeholder="Paste financial article text here..." />
          <div className="editor-buttons">
            <button className="glow-button copy-button" onClick={handleCopyText}>Copy</button>
            <button className="glow-button analyze-button" onClick={handleAnalyzeText} disabled={isProcessing || !currentTextContent}>
              {isProcessing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {statusMessage && <p className={`status-message ${statusMessage.startsWith('✅') ? 'success' : statusMessage.startsWith('⏳') ? 'pending' : 'error'}`}>{statusMessage}</p>}
      </div>

      <div className="output-column">
        {analysisResult && !analysisResult.error ? (
          <div className="extracted-json-wrapper">
            <h3 className="extracted-json-title">📊 Financial Analysis Result</h3>

        
            <div
              className="analysis-panel"
              title="Drag bottom edge to resize. Scroll inside if content is long."
              role="region"
              aria-label="Financial analysis result"
            >
           <JsonPrettyDisplay data={analysisResult} currencyFormatter={(v)=>String(v)} />

            </div>

            <button className="glow-button visualize-button" onClick={goToDashboard} style={{ marginTop: 14, width: "100%", fontSize: 15 }}>
              Visualize →
            </button>
          </div>
        ) : analysisResult && analysisResult.error ? (
          <div className="extracted-json-box error-box">
            <h3 className="extracted-json-title">⚠️ Analysis Error</h3>
            <p className="error-message">{analysisResult.error}</p>
          </div>
        ) : !isProcessing ? (
          <div className="placeholder-box">
            <p>Your analysis will appear here.</p>
            <p>Upload a file or paste text to begin.</p>
          </div>
        ) : (
          <div className="placeholder-box">
            <p>Processing your document...</p>
            <div className="loading-spinner" />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFile;
