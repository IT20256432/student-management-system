import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>EduRegister</h3>
          <p>Transforming education through innovative technology solutions.</p>
        </div>
        <div className="footer-section">
          <h4>Contact Info</h4>
          <p>Email: info@eduregister.com</p>
          <p>Phone: +94 11 234 5678</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#support">Support</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 EduRegister. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;