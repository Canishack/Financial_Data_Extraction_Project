import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './UploadFile.css';

const UploadFile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTextContent, setCurrentTextContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const textEditorRef = useRef(null);

  useEffect(() => {
    setCurrentTextContent(currentTextContent);
  }, [currentTextContent]);

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

    let textForLLM = '';

    try {
      if (selectedFile) {
        setStatusMessage('⏳ Uploading file and performing OCR...');
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('Backend response (Upload + OCR):', res.data);
        if (res.data.extractedText) {
          textForLLM = res.data.extractedText;
          setCurrentTextContent(textForLLM);
          setStatusMessage(`✅ File uploaded and text extracted successfully!`);
        } else {
          setCurrentTextContent('No text could be extracted from the document.');
          setStatusMessage(`⚠️ File uploaded, but no text extracted or an issue occurred.`);
        }
      } else if (currentTextContent) {
        textForLLM = currentTextContent;
        setStatusMessage(`✅ Article text ready for analysis!`);
      }

      if (textForLLM && textEditorRef.current) {
        textEditorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

    } catch (err) {
      console.error('Processing error:', err.response ? err.response.data : err.message);
      setStatusMessage(`❌ Processing failed: ${err.response?.data?.message || err.message}.`);
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
      const res = await axios.post('http://localhost:5000/api/analyze', {
        articleText: currentTextContent,
      });

      console.log('LLM Analysis response:', res.data);
      setAnalysisResult(res.data);
      setStatusMessage('✅ Financial analysis complete!');

    } catch (err) {
      console.error('Analysis error:', err.response ? err.response.data : err.message);
      setAnalysisResult({ error: err.response?.data?.message || err.message });
      setStatusMessage(`❌ Analysis failed: ${err.response?.data?.message || err.message}.`);
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

            <button
              className="glow-button"
              onClick={handleProcessInput}
              disabled={isProcessing || (!selectedFile && !currentTextContent)}
            >
              {isProcessing ? 'Processing...' : 'Process Content'}
            </button>
          </div>

          {selectedFile && (
            <p className="selected-file">
              📎 Selected File: <strong>{selectedFile.name}</strong>
            </p>
          )}
        </div>

        <div className="text-editor-section">
          <h3 className="text-editor-title">📝 Article Text Editor:</h3>
          <textarea
            ref={textEditorRef}
            className="text-editor-area"
            value={currentTextContent}
            onChange={handleTextEditorChange}
            placeholder="Paste your financial article text here, or upload a file to populate this editor..."
          ></textarea>
          <p className="scroll-hint">Scroll to view full text. You can edit this text before processing.</p>
          <div className="editor-buttons">
            <button className="glow-button copy-button" onClick={handleCopyText}>
              Copy Text
            </button>
            <button
              className="glow-button analyze-button"
              onClick={handleAnalyzeText}
              disabled={isProcessing || !currentTextContent}
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Text'}
            </button>
          </div>
        </div>

        {statusMessage && (
          <p className={`status-message ${statusMessage.startsWith('✅') ? 'success' : statusMessage.startsWith('⏳') ? 'pending' : 'error'}`}>
            {statusMessage}
          </p>
        )}
      </div>

      <div className="output-column">
        {analysisResult && typeof analysisResult === 'object' && !analysisResult.error ? (
          <div className="extracted-json-box">
            <h3 className="extracted-json-title">📊 Financial Analysis Result:</h3>
            <div className="analysis-data-display">
              {Object.entries(analysisResult).map(([key, value]) => (
                <div key={key} className="data-row">
                  <span className="data-label">{key}:</span>
                  <span className="data-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : analysisResult && analysisResult.error ? (
          <div className="extracted-json-box error-box">
            <h3 className="extracted-json-title">⚠️ Analysis Error:</h3>
            <p className="error-message">{analysisResult.error}</p>
          </div>
        ) : !isProcessing && (
          <div className="placeholder-box">
            <p>Your financial analysis results will appear here.</p>
            <p>Upload a document or paste text on the left to get started!</p>
          </div>
        )}
        {isProcessing && (
          <div className="placeholder-box">
            <p>Processing your document...</p>
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadFile;
