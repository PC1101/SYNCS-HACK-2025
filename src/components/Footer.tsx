import React from 'react';
import { Building2, Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  const footerSections = [
    {
      title: 'Solutions',
      links: ['Harbour Management', 'Transport Integration', 'Climate Resilience', 'Coastal Planning'],
    },
    {
      title: 'Technologies',
      links: ['AI & Machine Learning', 'Harbour Sensors', 'Offshore Wind', 'Sydney Digital Twin'],
    },
    {
      title: 'Resources',
      links: ['UNSW Research', 'Pilot Programs', 'Best Practices', 'Council Guidelines'],
    },
    {
      title: 'Community',
      links: ['Council Partners', 'Developer Portal', 'Innovation Precincts', 'Sydney Events'],
    },
  ];

  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <Building2 className="h-10 w-10 text-emerald-400" />
              <span className="text-2xl font-bold">Sydney 2050</span>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
              Leading Australia's transformation into a world-class smart city, 
              balancing harbour heritage with cutting-edge innovation.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-300">hello@sydney2050.nsw.gov.au</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-300">+61 2 9265 9333</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-300">Sydney, NSW, Australia</span>
              </div>
            </div>

            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="p-3 bg-gray-800 rounded-full hover:bg-emerald-600 transition-colors duration-300"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {footerSections.map((section, index) => (
              <div key={section.title}>
                <h4 className="text-lg font-semibold mb-4 text-emerald-400">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href="#"
                        className="text-gray-300 hover:text-white transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400">
              © 2025 Sydney 2050. Building Australia's smartest harbour city.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};