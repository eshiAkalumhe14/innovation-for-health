import logo from './logo_op2.png';
import './App.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BrowserRouter as Router, Routes, Route } from 'react-router';
import HomePage from './Home.js';
import LightMode from './lightmode.png'
import DarkMode from './darkmode.png';
import { HeartHandshake } from 'lucide-react';



function App() {

    const [slideOut, setSlideOut] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [theme, setTheme] = useState('light'); // Default theme is light mode (setTheme is a function that updates the theme)

    useEffect(() => {
      // Navigate to the home page after 2 minutes
      const timer = setTimeout(() => {
        setSlideOut(true);
      }, 5000);

      return () => clearTimeout(timer); // Clear the timer when the component unmounts
    }, []);

    useEffect(() => {
      if (slideOut) {
        const timeout = setTimeout(() => {
          setShowIntro(false);
        }
        , 100);
        return () => clearTimeout(timeout);
      }
    }, [slideOut]);

    const toggleTheme = () =>{
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    }

  return (
    <div className={`App ${theme}`}>
    {showIntro ? (
      <div className={`App intro-screen ${slideOut ? 'slide-up' : ''}`}>
        <header className="App-header">
          <div className="switch-wrapper" onClick={toggleTheme}>
                <div className={`switch-track ${theme}`}>
                  <div className={`switch-thumb ${theme}`}>
                    <img
                      src={theme === 'dark' ? DarkMode : LightMode}
                      alt="Theme icon"
                      className="theme-icon"
                    />
                  </div>
                </div>
              </div>
              <HeartHandshake className="App-logo " size={500} />
          <h1 className="App-title">
            <span className="coloured-text">S</span>afe<span className="coloured-text">S</span>pace<span className="coloured-text">AI</span> </h1>
          <h3 className="App-tagline">
            For Every <span className="coloured-text">Survivor</span>. For Every{' '}
            <span className="coloured-text">Story</span>.
          </h3>
        </header>
    </div> ):(<HomePage theme={theme} toggleTheme={toggleTheme} />)}
    </div>
  );
}

export default App;