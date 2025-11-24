import './Navbarcss.css';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = ({ title }) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    let i = 0;

    const interval = setInterval(() => {
      setDisplayText(title.slice(0, i + 1));
      i++;
      if (i === title.length) clearInterval(interval);
    }, 80);

    return () => clearInterval(interval);
  }, [title]);

  return (
    <div className="container-fluid">
      <ul>
        <li className="todo">
          {displayText}
          <span className="cursor">|</span>
        </li>

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
