import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, Heart, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Home() {
  const { t } = useTranslation();

  const benefits = [
    { icon: DollarSign, title: t('home.benefits.salary'), description: t('home.benefits.salaryDesc'), color: 'bg-blue-100 text-blue-600' },
    { icon: TrendingUp, title: t('home.benefits.growth'), description: t('home.benefits.growthDesc'), color: 'bg-green-100 text-green-600' },
    { icon: Heart, title: t('home.benefits.benefits'), description: t('home.benefits.benefitsDesc'), color: 'bg-red-100 text-red-600' },
    { icon: Users, title: t('home.benefits.culture'), description: t('home.benefits.cultureDesc'), color: 'bg-yellow-100 text-yellow-600' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-r from-[#1a365d] to-[#2d4a7c] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">{t('home.heroTitle')}</h1>
          <p className="text-xl mb-8 text-gray-200">{t('home.heroSubtitle')}</p>
          <Link
            to="/jobs"
            className="inline-block bg-[#f6ad55] text-[#1a365d] px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#f6ad55]/90 transition"
          >
            {t('home.browseJobs')}
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#1a365d] text-center mb-12">
          {t('home.benefits.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition">
                <div className={`w-16 h-16 ${benefit.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1a365d] mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1a365d] mb-6">
            {t('home.joinTeam.title')}
          </h2>
          <p className="text-lg text-gray-600 mb-8">{t('home.joinTeam.description')}</p>
          <Link
            to="/jobs"
            className="inline-block bg-[#1a365d] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#1a365d]/90 transition"
          >
            {t('home.browseJobs')}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
