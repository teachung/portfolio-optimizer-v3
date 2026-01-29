import React from 'react';
import { Quote } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

const TestimonialCard: React.FC<{ 
  user: any;
  image: string;
  reverse?: boolean;
}> = ({ user, image, reverse }) => (
  <div className={`flex flex-col md:flex-row gap-8 items-stretch mb-16 ${reverse ? 'md:flex-row-reverse' : ''}`}>
    {/* Image Section - Enforced Vertical Rectangle */}
    <div className="w-full md:w-5/12 shrink-0">
      <div className="relative w-full h-[450px] md:h-[550px] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 group">
        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
        <img 
          src={image} 
          alt={user.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
    </div>

    {/* Content Section - Distinct Rounded Card */}
    <div className="w-full md:w-7/12 bg-[#13132b] p-8 md:p-14 rounded-[2rem] flex flex-col justify-center relative shadow-xl border border-white/5">
      <Quote size={40} className="text-slate-600 mb-8 fill-slate-600/50" />
      
      <p className="text-slate-200 text-xl md:text-2xl leading-relaxed mb-10 font-medium italic">
        "{user.quote}"
      </p>
      
      <div className="border-l-4 border-emerald-500 pl-6">
        <h4 className="text-2xl font-bold text-white mb-1">{user.name}</h4>
        <p className="text-emerald-400 text-sm font-bold tracking-widest uppercase">{user.role}</p>
      </div>
    </div>
  </div>
);

export const Testimonials: React.FC = () => {
  const { t } = useTranslation();
  const users = t('testimonials.users');

  // Updated images to user's specific selection
  const images = [
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800", // Man in suit profile
    "https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&q=80&w=800", // Woman working
    "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&q=80&w=800"  // Man in Asian setting
  ];

  return (
    <section id="testimonials" className="py-24 bg-[#0B1120] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('testimonials.title')}
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="space-y-16">
           <TestimonialCard 
             user={users[0]}
             image={images[0]}
           />
           <TestimonialCard 
             user={users[1]}
             image={images[1]}
             reverse
           />
           <TestimonialCard 
             user={users[2]}
             image={images[2]}
           />
        </div>

        {/* Stats Bar */}
        <div className="mt-32 pt-16 border-t border-slate-800/50 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2 group-hover:scale-110 transition-transform font-mono">10,000+</div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">{t('testimonials.stats.users')}</div>
            </div>
            <div className="group">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2 group-hover:scale-110 transition-transform font-mono">50M+</div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">{t('testimonials.stats.sims')}</div>
            </div>
            <div className="group">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2 group-hover:scale-110 transition-transform font-mono">4.9/5</div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">{t('testimonials.stats.rating')}</div>
            </div>
             <div className="group">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2 group-hover:scale-110 transition-transform font-mono">98%</div>
                <div className="text-slate-500 text-sm font-bold uppercase tracking-wider">{t('testimonials.stats.satisfaction')}</div>
            </div>
        </div>

      </div>
    </section>
  );
};