import React from 'react';
import { Laptop, Coffee, Wifi, Users, MapPin, Clock } from 'lucide-react';

export const FutureWork: React.FC = () => {
  const workSolutions = [
    {
      icon: Laptop,
      title: 'Remote Work Hubs',
      description: 'Co-working spaces from Bondi Junction to Blacktown with harbour views.',
      stats: '150+ locations',
      features: ['NBN Enterprise grade', 'Harbour-view meeting rooms', '24/7 tech support'],
    },
    {
      icon: Coffee,
      title: 'Flexible Workspaces',
      description: 'Adaptive spaces in converted warehouses and modern towers across Sydney.',
      stats: '24/7 access',
      features: ['Modular Australian-made furniture', 'Climate control', 'Rooftop wellness areas'],
    },
    {
      icon: Users,
      title: 'Gig Economy Platform',
      description: 'Connecting Sydney freelancers with local businesses from Manly to Maroubra.',
      stats: '85K+ workers',
      features: ['Skills matching', 'Fair Work compliance', 'TAFE partnership programs'],
    },
    {
      icon: MapPin,
      title: 'Neighborhood Networks',
      description: 'Community hubs in every suburb fostering local innovation and connection.',
      stats: '38 LGA networks',
      features: ['Council partnerships', 'Mentorship programs', 'Local business support'],
    },
  ];

  const statistics = [
    { label: 'Remote Workers', value: '68%', subtitle: 'of Sydney workforce' },
    { label: 'Productivity Increase', value: '+28%', subtitle: 'vs traditional CBD offices' },
    { label: 'Commute Reduction', value: '-45%', subtitle: 'cross-harbour travel' },
    { label: 'Work-Life Balance', value: '4.9/5', subtitle: 'satisfaction rating' },
  ];

  return (
    <section id="work" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sydney's Future Workforce
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Supporting Sydney's diverse workforce from Parramatta to the CBD, 
            building Australia's most flexible and connected work ecosystem.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statistics.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-gray-900 font-semibold mb-1">{stat.label}</div>
              <div className="text-gray-600 text-sm">{stat.subtitle}</div>
            </div>
          ))}
        </div>

        {/* Work Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {workSolutions.map((solution, index) => {
            const Icon = solution.icon;
            
            return (
              <div
                key={solution.title}
                className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{solution.title}</h3>
                    <p className="text-indigo-600 font-semibold">{solution.stats}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">{solution.description}</p>
                
                <div className="space-y-2">
                  {solution.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Future Work Vision */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">The Future Workplace</h3>
              <p className="text-indigo-100 mb-6 leading-relaxed">
                Sydney 2050 will lead Australia in workplace innovation, supporting flexible work 
                while maintaining our position as the Asia-Pacific business hub.
              </p>
              <div className="flex items-center space-x-4">
                <Clock className="h-6 w-6 text-indigo-300" />
                <span className="text-indigo-100">24/7 accessible across all time zones</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Wifi className="h-8 w-8 text-indigo-300 mx-auto mb-2" />
                <div className="text-lg font-bold">100%</div>
                <div className="text-indigo-200 text-sm">Connectivity</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Users className="h-8 w-8 text-indigo-300 mx-auto mb-2" />
                <div className="text-lg font-bold">15K+</div>
                <div className="text-indigo-200 text-sm">Daily Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};