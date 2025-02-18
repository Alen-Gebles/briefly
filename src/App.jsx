/* global chrome */
import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
  const API_KEY = process.env.REACT_APP_HUGGINGFACE_API_KEY;

  useEffect(() => {
    summarizeCurrentPage();
  }, []);

  const getCurrentPageContent = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url.startsWith('chrome://')) {
        throw new Error("Cannot summarize Chrome system pages");
      }

      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const article = document.querySelector('article') || document.querySelector('main');
          const content = article ? article.innerText : document.body.innerText;
          return content
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);
        }
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to get page content: ${error.message}`);
    }
  };

  const formatSummaryIntoBullets = (text) => {
    // Split the text into sentences
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
    // Group related sentences and create bullet points
    const bulletPoints = [];
    let currentTopic = [];
    
    sentences.forEach(sentence => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length > 0) {
        // If the sentence is a new topic or we don't have any topics yet
        if (currentTopic.length === 0 || currentTopic.length >= 2) {
          if (currentTopic.length > 0) {
            bulletPoints.push(currentTopic.join(' '));
          }
          currentTopic = [trimmedSentence];
        } else {
          currentTopic.push(trimmedSentence);
        }
      }
    });
    
    // Add the last topic if it exists
    if (currentTopic.length > 0) {
      bulletPoints.push(currentTopic.join(' '));
    }
    
    return bulletPoints;
  };

  const summarizeText = async (text) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            max_length: 500,  // Increased from 150 to 500
            min_length: 200,  // Increased from 40 to 200
            do_sample: false,
            length_penalty: 2.0,  // Added to encourage longer sequences
            num_beams: 4  // Added for better text generation
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data[0] && data[0].summary_text) {
        // Convert the summary into bullet points
        return formatSummaryIntoBullets(data[0].summary_text);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      throw new Error(`API Error: ${error.message}`);
    }
  };

  const summarizeCurrentPage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const pageContent = await getCurrentPageContent();
      if (!pageContent) {
        throw new Error("No content found to summarize");
      }
      
      const summaryPoints = await summarizeText(pageContent);
      setSummary(summaryPoints);
    } catch (err) {
      setError(err.message);
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="appContent">
        <h2 className="title">Page Summary</h2>
        <div className="innerContent">
          {loading && <p className="loading">Generating summary...</p>}
          {error && <p className="error">Error: {error}</p>}
          {!loading && !error && summary.length > 0 && (
            <ul className="summary-list">
              {summary.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          )}
          {!loading && !error && summary.length === 0 && (
            <p className="no-summary">No summary available</p>
          )}
        </div>
      </div>
        
    </div>
  );
}

export default App;