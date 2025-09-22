import './Navbarcss.css';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

const Navbar = ({ title }) => {
  const [displayText, setDisplayText] = useState('');
  // 1. Create a ref to hold the index. It won't be reset on re-renders.
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset the text and index whenever the title prop changes.
    setDisplayText('');
    indexRef.current = 0;

    const intervalId = setInterval(() => {
      // 2. Use the ref's 'current' property to check the length.
      if (indexRef.current < title.length) {
        // Use a functional update to be safe, appending the correct character.
        setDisplayText((prev) => prev + title.charAt(indexRef.current));
        // 3. Increment the ref's value. This does NOT cause a re-render.
        indexRef.current++;
      } else {
        clearInterval(intervalId);
      }
    }, 150);

    // The cleanup function will clear the interval correctly.
    return () => clearInterval(intervalId);
  }, [title]); // The effect correctly re-runs only when the title prop changes.

  return (
    <div className="container-fluid">
      <ul>
        <li className="todo">{displayText}</li>
        <li className="links"><Link to="/">Home</Link></li>
        <li className="links"><Link to="/about">About</Link></li>
        <li className="links"><Link to="/contact">Contact-us</Link></li>
        <li>
          <input type="search" placeholder="Search..." />
        </li>
      </ul>
    </div>
  );
};

export default Navbar;

