import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const ProfessionalFooter = () => {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <footer className="professional-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-grid">
            {/* Brand Column */}
            <div className="footer-column brand-column">
              <div className="footer-logo">
                <div className="logo-icon">🏫</div>
                <div className="logo-text">
                  <h3>Sammana Institute</h3>
                  <span>Excellence in Education</span>
                </div>
              </div>
              <p className="brand-description">
                Empowering students through innovative learning solutions and comprehensive 
                educational management systems since 2010.
              </p>
              <div className="accreditation">
                <div className="accreditation-badge">
                  <span>✓</span>
                  <span>MOE Accredited</span>
                </div>
                <div className="accreditation-badge">
                  <span>✓</span>
                  <span>ISO 9001:2015</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-column">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/students">Student Management</Link></li>
                <li><Link to="/attendance">Attendance</Link></li>
                <li><Link to="/fees">Fee Management</Link></li>
                <li><Link to="/classes">Class Management</Link></li>
                <li><Link to="/reports">Reports & Analytics</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="footer-column">
              <h4>Resources</h4>
              <ul className="footer-links">
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/documentation">Documentation</Link></li>
                <li><Link to="/tutorials">Video Tutorials</Link></li>
                <li><Link to="/api-docs">API Documentation</Link></li>
                <li><Link to="/updates">System Updates</Link></li>
                <li><Link to="/support">Technical Support</Link></li>
              </ul>
            </div>

            {/* Contact Information */}
            <div className="footer-column">
              <h4>Contact Info</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📍</span>
                  <div>
                    <p>123 Education Street</p>
                    <p>Colombo 07, Sri Lanka</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <div>
                    <p>+94 11 234 5678</p>
                    <p>+94 77 123 4567</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <div>
                    <p>info@sammana.edu.lk</p>
                    <p>support@sammana.edu.lk</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🕒</span>
                  <div>
                    <p>Mon - Fri: 7:00 AM - 5:00 PM</p>
                    <p>Sat: 8:00 AM - 1:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter & Social */}
            <div className="footer-column">
              <h4>Stay Updated</h4>
              <div className="newsletter-section">
                <p>Subscribe to our newsletter for updates and announcements.</p>
                <div className="newsletter-form">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="newsletter-input"
                  />
                  <button className="newsletter-btn">
                    Subscribe
                  </button>
                </div>
              </div>
              
              <div className="social-section">
                <h5>Connect With Us</h5>
                <div className="social-links">
                  <a href="#" className="social-link" aria-label="Facebook">
                    <span className="social-icon">f</span>
                  </a>
                  <a href="#" className="social-link" aria-label="Twitter">
                    <span className="social-icon">𝕏</span>
                  </a>
                  <a href="#" className="social-link" aria-label="LinkedIn">
                    <span className="social-icon">in</span>
                  </a>
                  <a href="#" className="social-link" aria-label="YouTube">
                    <span className="social-icon">▶️</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} Sammana Institute. All rights reserved.</p>
            </div>
            
            <div className="legal-links">
              <Link to="/privacy" className="legal-link">Privacy Policy</Link>
              <span className="separator">|</span>
              <Link to="/terms" className="legal-link">Terms of Service</Link>
              <span className="separator">|</span>
              <Link to="/cookies" className="legal-link">Cookie Policy</Link>
              <span className="separator">|</span>
              <Link to="/sitemap" className="legal-link">Sitemap</Link>
            </div>

            <div className="system-info">
              <span>v2.1.0 • Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className={`back-to-top ${isVisible ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <span className="arrow-icon">↑</span>
      </button>
    </footer>
  );
};

export default ProfessionalFooter;