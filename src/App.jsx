import React from 'react';
import Interact from './pages/Interact';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* This renders your main Hachi interface directly. 
        It removes the need for react-router-dom and clears the error.
      */}
      <Interact />
    </div>
  );
}

export default App;