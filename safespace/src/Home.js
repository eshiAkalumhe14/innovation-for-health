import './home.css';
import {useState, useEffect, useRef, use} from 'react';
import LightMode from './lightmode.png'
import DarkMode from './darkmode.png'
import logo from './logo_op2.png';
import { SendHorizonal, AlignRight , Copy, ThumbsUp, ThumbsDown, Volume2,  Plus,
  Search, SquarePen, HeartHandshake, LogOut, Trash  } from 'lucide-react'
  function HomePage({ theme, toggleTheme }) {
    const [chatSessions, setChatSessions] = useState([]);
    const [currentSessionIndex, setCurrentSessionIndex] = useState(null);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [showAutoClearWarning, setShowAutoClearWarning] = useState(false);
    const [autoClearCountdown, setAutoClearCountdown] = useState(30);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
  

  
    const latestConvRef = useRef(null);
    const chatWindowRef = useRef(null);
  
    useEffect(() => {
      const handleKeyDown = (e) => {
        setLastActivity(Date.now());
        if (e.key === 'Escape') {
          window.location.href = 'https://www.youtube.com';
        }
      };
  
      const handleUserClick = () => setLastActivity(Date.now());
  
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', handleUserClick);
  
      const interval = setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        if (inactiveTime > 5 * 60 * 1000 && !showAutoClearWarning) {
          setShowAutoClearWarning(true);
          setAutoClearCountdown(30);
        }
      }, 10000);
  
      return () => {
        clearInterval(interval);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('click', handleUserClick);
      };
    }, [lastActivity, showAutoClearWarning]);
  
    useEffect(() => {
      let countdownInterval;
      if (showAutoClearWarning) {
        countdownInterval = setInterval(() => {
          setAutoClearCountdown((prev) => {
            if (prev <= 1) {
              setShowAutoClearWarning(false);
              setChatSessions([]);
              setCurrentSessionIndex(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      return () => clearInterval(countdownInterval);
    }, [showAutoClearWarning]);
  
    useEffect(() => {
      if (latestConvRef.current) {
        latestConvRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, [chatSessions]);
  
    useEffect(() => {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = chatWindowRef.current;
        setShowScrollToBottom(scrollTop + clientHeight < scrollHeight - 100);
      };
      if (chatWindowRef.current) {
        chatWindowRef.current.addEventListener('scroll', handleScroll);
      }
      return () => {
        if (chatWindowRef.current) {
          chatWindowRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }, []);
  
    const scrollToBottom = () => {
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollTo({ top: chatWindowRef.current.scrollHeight, behavior: 'smooth' });
      }
    };
  
    const cancelAutoClear = () => {
      setShowAutoClearWarning(false);
      setLastActivity(Date.now());
    };
  
    const startNewChat = () => {
      const newSession = { title: '', messages: [], timestamp: new Date() };
      setChatSessions((prev) => {
        const updated = [...prev, newSession];
        setCurrentSessionIndex(updated.length - 1);
        return updated;
      });
    };
  
    const clearChat = () => {
      setChatSessions((prev) => {
        if (currentSessionIndex !== null && prev[currentSessionIndex]) {
          const updated = [...prev];
          updated[currentSessionIndex] = { ...updated[currentSessionIndex], messages: [] };
          return updated;
        }
        return prev;
      });
    };
  
    const deleteSession = (index) => setPendingDeleteIndex(index);
    const confirmDeleteSession = () => {
      setChatSessions((prev) => {
        const updated = prev.filter((_, i) => i !== pendingDeleteIndex);
        if (currentSessionIndex === pendingDeleteIndex) {
          setCurrentSessionIndex(null);
        } else if (currentSessionIndex > pendingDeleteIndex) {
          setCurrentSessionIndex(currentSessionIndex - 1);
        }
        return updated;
      });
      setPendingDeleteIndex(null);
    };
    const cancelDeleteSession = () => setPendingDeleteIndex(null);

    const handleCopy = (text) => {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log("Copied to clipboard");
        })
        .catch(err => {
          console.error("Copy failed", err);
        });
    };

    const sendFeedback = async (rating, message) => {
      try {
        const response = await fetch("http://localhost:8000/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: currentSessionIndex,
            message,
            rating
          })
        });
        const data = await response.json();
        console.log("Feedback sent:", data);
      } catch (err) {
        console.error("Error sending feedback:", err);
      }
    };
    
    

    useEffect(() => {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log(voices);
      };
    
      // Voices might not be immediately loaded
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }, []);

    const handleSpeak = (text) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synth.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google US English"));
    
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    
      utterance.rate = 1; // Speed (0.5 - 2)
      utterance.pitch = 1; // Tone (0 - 2)
      synth.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
     console.log(voices); // List of all available voices
    
    
    
  
    const sendMessage = async () => {
      if (!input.trim()) return;
  
      if (currentSessionIndex === null) {
        const newSession = { title: '', messages: [], timestamp: new Date() };
        const updated = [...chatSessions, newSession];
        setChatSessions(updated);
        setCurrentSessionIndex(updated.length - 1);
        return;
      }
  
      const updatedSessions = [...chatSessions];
      const currentSession = updatedSessions[currentSessionIndex];
      const userMsg = { user: input, bot: '', timestamp: new Date() };
  
      currentSession.messages.push(userMsg);
      setChatSessions(updatedSessions);
      setInput('');
      setTyping(true);
  
      try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input })
        });
  
        const data = await response.json();
        currentSession.messages[currentSession.messages.length - 1].bot = data.response;
        setTyping(false);
        setChatSessions([...updatedSessions]);

        if (!currentSession.title && data.response) {
          // Simple keyword extraction: filter long, meaningful words (ignore "the", "is", etc.)
          const stopwords = ["the", "and", "for", "with", "this", "that", "are", "you", "your", "have", "has", "was", "were", "but", "they", "their", "them", "from", "then", "when", "how", "what", "why", "can", "will", "would", "should", "could", "it's", "i'm"];
          const words = data.response
            .toLowerCase()
            .replace(/[^a-zA-Z\s]/g, '') // remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopwords.includes(word));
        
          const frequency = {};
          words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
          });
        
          // Sort by frequency and pick top 2–3 unique keywords
          const topKeywords = [...new Set(Object.entries(frequency))]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([word]) => word);
        
          currentSession.title = topKeywords.length ? topKeywords.join(' ') : "New Chat";
        }
  
        setTimeout(() => {
          if (latestConvRef.current) {
            latestConvRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
      } catch (err) {
        console.error("Failed to fetch response:", err);
        setTyping(false);
      }
    };
  
    const handleOverlayClick = () => setSidebarOpen(false);
    const handleExit = () => window.location.href = 'https://www.youtube.com';
    const currentMessages = chatSessions[currentSessionIndex]?.messages || [];
  
    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      });
    };


  const filteredSessions = chatSessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
    return (
      <div className={`home-container ${theme}`}>
        {showAutoClearWarning && (
          <div className="auto-clear-warning">
            <p>This chat will be cleared in {autoClearCountdown} seconds due to inactivity.</p>
            <div className="warning-buttons">
              <button onClick={cancelAutoClear}>Stay in Chat</button>
            </div>
          </div>
        )}
  
        {pendingDeleteIndex !== null && (
          <div className="confirm-dialog">
            <p>Are you sure you want to delete this chat session?</p>
            <div className="dialog-buttons">
              <button onClick={confirmDeleteSession}>Yes</button>
              <button onClick={cancelDeleteSession}>No</button>
            </div>
          </div>
        )}
  
        <div className="logo-name">
          <AlignRight className="sidebar-icon" size={30} onClick={() => setSidebarOpen(!sidebarOpen)} />
          <SquarePen className="sidebar-icon" size={30} onClick={startNewChat} />
          <HeartHandshake className="sidebar-icon" size={30} />
          <LogOut className="sidebar-icon" size={30} onClick={handleExit} title="Exit" />
        </div>
  
        {sidebarOpen && (
            <>
              <div className="sidebar-overlay" onClick={handleOverlayClick}></div>
              <div className={`sidebar ${theme}`}>
                <div className='sidebar-header'>
                  <AlignRight className="sidebar-icon" size={30} onClick={() => setSidebarOpen(false)} />
                  <SquarePen className="sidebar-icon" size={30} onClick={startNewChat} />
                  <Search className="sidebar-icon" size={30} onClick={() => setShowSearch(prev => !prev)} />
                </div>

                {showSearch && (
                  <input
                    type="text"
                    placeholder="Search chat titles..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                )}

                <hr />
                <div className="sidebar-content">
                  <ul>
                    {filteredSessions.map((session, index) => {
                      const realIndex = chatSessions.indexOf(session); // get the true index
                      return (
                        <li key={realIndex} className={`session-entry fade-in ${realIndex === currentSessionIndex ? 'active-session' : ''}`}>
                          <div className="session-title" onClick={() => setCurrentSessionIndex(realIndex)}>
                            <span>{session.title || 'New Chat'}</span>

                          </div>
                          <Trash className="delete-icon" size={16} onClick={() => deleteSession(realIndex)} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="sidebar-footer">
                  <div className="exit-instructions">
                    <p>Press <strong>Esc</strong> or click <strong>Exit</strong> to leave this page quickly.</p>
                  </div>
                  <button onClick={clearChat} className="sidebar-button">Clear Chat</button>
                </div>
              </div>
            </>
          )}
  
        <div className="page_header">
          <div className="switch-wrapper" onClick={toggleTheme}>
            <div className={`switch-track ${theme}`}>
              <div className={`switch-thumb ${theme}`}>
                <img src={theme === 'dark' ? DarkMode : LightMode} alt="Theme icon" className="theme-icon" />
              </div>
            </div>
          </div>
        </div>
  
        <div className="page_body">
          <div className="chatbot-container">
            <div className="chatbot-wrapper">
              <div className="chat-window" ref={chatWindowRef}>
                {currentMessages.map((conv, i) => (
                  <div key={i} className="conversation fade-in" ref={i === currentMessages.length - 1 ? latestConvRef : null}>
                    <div className="timestamp">{formatTime(conv.timestamp || new Date())}</div>
                    <div className="chat-msg user">
                      <div className="msg-bubble">{conv.user}</div>
                    </div>
                    {conv.bot && (
                      <div className="chat-msg ai">
                        <div className="msg-bubble">{conv.bot}</div>
                        <div className="response-icons">
                          <button className="icon-button" onClick={() => handleCopy(conv.bot)}><Copy size={16} className="icon" /></button>
                          <button className="icon-button" onClick={() => sendFeedback("thumbs_up", conv.bot)}><ThumbsUp size={16} className="icon" /></button>
                          <button className="icon-button" onClick={() => sendFeedback("thumbs_down", conv.bot)}><ThumbsDown size={16} className="icon" /></button>
                          <button className="icon-button" onClick={() => handleSpeak(conv.bot)}><Volume2 size={16} className="icon" /></button>
                        </div>
                      </div>
                      
                    )}
                        {typing && (
                      <div className="chat-msg ai fade-in">
                        <div className="msg-bubble typing">
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {showScrollToBottom && (
                  <button className="scroll-to-bottom" onClick={scrollToBottom}>↓ Scroll to Latest</button>
                )}
              </div>
  
              <div className="chat-input-wrapper">
                <div className="chat-input">
                <textarea
                      className="chat-textarea"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto'; // reset height
                        e.target.style.height = e.target.scrollHeight + 'px'; // adjust to content
                      }}
                      placeholder="Ask me anything... I'm here to help."
                      rows={1}
                    />
                  <button onClick={sendMessage}>
                    <SendHorizonal size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <footer className={`footer-message ${theme}`}>
          <p><strong>Your privacy matters.</strong> Everything you say to SafeSpaceAI is anonymous and confidential.</p>
          <p className="copyright">© {new Date().getFullYear()} SafeSpaceAI. All rights reserved.</p>
        </footer>
      </div>
    );
  }
  
  export default HomePage;
  
  