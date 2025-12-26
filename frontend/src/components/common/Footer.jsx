import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

const ModernFooter = () => {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = [
    { path: '/dashboard', icon: '📊', text: 'Dashboard' },
    { path: '/register', icon: '👤', text: 'Register' },
    { path: '/attendance', icon: '✅', text: 'Attendance' },
    { path: '/fee-payment', icon: '💳', text: 'Payments' },
    { path: '/students', icon: '🎓', text: 'Students' },
    { path: '/reports', icon: '📈', text: 'Reports' },
  ];

  const quickLinks = [
    { text: 'Help Center', path: '/help' },
    { text: 'Documentation', path: '/docs' },
    { text: 'Support', path: '/support' },
    { text: 'Contact Us', path: '/contact' },
  ];

  const legalLinks = [
    { text: 'Privacy Policy', path: '/privacy' },
    { text: 'Terms of Service', path: '/terms' },
    { text: 'Cookie Policy', path: '/cookies' },
  ];

  return (
    <>
      <footer className="modern-footer">
        {/* Top Section - Gradient Background */}
        <div className="footer-top">
          <div className="footer-container">
            <div className="footer-main-content">
              {/* Brand Section */}
              <div className="footer-brand">
                <Link to="/dashboard" className="footer-logo">
                  <div className="footer-logo-icon">
                    <div className="logo-symbol">🎓</div>
                  </div>
                  <div className="footer-logo-text">
                    <h2>Sammana</h2>
                    <span>Educational Institute</span>
                  </div>
                </Link>
                <p className="footer-tagline">
                  Empowering the next generation through excellence in education and innovative learning solutions.
                </p>
                
                {/* Social Links */}
                <div className="footer-social">
                  <h4>Connect With Us</h4>
                  <div className="social-icons">
                    <a href="https://www.facebook.com/" className="social-icon" aria-label="Facebook">
                      <span>f</span>
                    </a>
                    <a href="https://x.com/" className="social-icon" aria-label="Twitter">
                      <span>𝕏</span>
                    </a>
                    <a href="https://www.instagram.com/" className="social-icon" aria-label="Instagram">
                      <span>📷</span>
                    </a>
                    <a href="https://www.linkedin.com/" className="social-icon" aria-label="LinkedIn">
                      <span>in</span>
                    </a>
                    <a href="https://www.youtube.com/" className="social-icon" aria-label="YouTube">
                      <span>▶️</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="footer-navigation">
                <div className="footer-nav-section">
                  <h3>Quick Access</h3>
                  <div className="footer-nav-links">
                    {footerLinks.map((link) => (
                      <Link 
                        key={link.path} 
                        to={link.path}
                        className={`footer-nav-link ${activeLink === link.path ? 'active' : ''}`}
                      >
                        <span className="nav-link-icon">{link.icon}</span>
                        <span className="nav-link-text">{link.text}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="footer-nav-section">
                  <h3>Resources</h3>
                  <div className="footer-nav-links">
                    {quickLinks.map((link) => (
                      <Link key={link.path} to={link.path} className="footer-nav-link">
                        <span className="nav-link-icon">→</span>
                        <span className="nav-link-text">{link.text}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact & Newsletter */}
              <div className="footer-contact">
                <div className="contact-section">
                  <h3>Contact Information</h3>
                  <div className="contact-details">
                    <div className="contact-item">
                      <span className="contact-icon">📍</span>
                      <div className="contact-info">
                        <p>Sammana Institute</p>
                        <p>Sarananda Mawatha, Kalutara, Sri Lanka</p>
                      </div>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">📞</span>
                      <div className="contact-info">
                        <p>+94 11 234 5678</p>
                        <p>+94 77 123 4567</p>
                      </div>
                    </div>
                    <div className="contact-item">
                      <span className="contact-icon">✉️</span>
                      <div className="contact-info">
                        <p>info@sammana.edu.lk</p>
                        <p>support@sammana.edu.lk</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-container">
            <div className="footer-bottom-content">
              <div className="copyright">
                <p>&copy; {currentYear} Sammana Educational Institute. All rights reserved.</p>
                <span className="version">v2.1.0 • {new Date().toLocaleDateString()}</span>
              </div>

              <div className="legal-links">
                {legalLinks.map((link, index) => (
                  <React.Fragment key={link.path}>
                    <Link to={link.path} className="legal-link">
                      {link.text}
                    </Link>
                    {index < legalLinks.length - 1 && (
                      <span className="link-separator">•</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button 
        className={`back-to-top ${isVisible ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  );
};

export default ModernFooter;