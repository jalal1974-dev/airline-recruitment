import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#1a365d] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{t('nav.logo')}</h3>
            <p className="text-gray-300 text-sm">{t('footer.aboutText')}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-[#f6ad55] transition text-sm">{t('home.heroTitle')}</Link></li>
              <li><Link to="/jobs" className="text-gray-300 hover:text-[#f6ad55] transition text-sm">{t('nav.jobs')}</Link></li>
              <li><Link to="/login" className="text-gray-300 hover:text-[#f6ad55] transition text-sm">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="text-gray-300 hover:text-[#f6ad55] transition text-sm">{t('nav.register')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <Mail className="w-4 h-4 text-[#f6ad55]" />
                <span>careers@jordanaviation.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <Phone className="w-4 h-4 text-[#f6ad55]" />
                <span>+962 6 XXX XXXX</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4 text-[#f6ad55]" />
                <span>{t('footer.addressText')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Jordan Aviation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
