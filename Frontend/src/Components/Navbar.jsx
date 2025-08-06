import './Navbarcss.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = ({ title }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < title.length) {
        setDisplayText((prev) => prev + title.charAt(index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [title]);

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
