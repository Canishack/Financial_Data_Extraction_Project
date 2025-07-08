import './Navbarcss.css';

const Navbar = ({title}) => {
  return (
      <div className="container-fluid">
        <ul>  
        <li className="todo">{title}</li>  
        <li className="links">Home</li>
        <li className="links">About</li>
        <li className="links">Contact-Us</li>
        <li>
            <input type="search" placeholder="Search..."/>
    </li>
    </ul>
    </div>
  )
  
};



export default Navbar;
