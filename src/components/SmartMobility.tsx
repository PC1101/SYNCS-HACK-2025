import React from 'react';
import { Car, Bike, Bus, Plane, Navigation, Battery } from 'lucide-react';

export const SmartMobility: React.FC = () => {
  const mobilityOptions = [
    {
      icon: Bus,
      title: 'Autonomous Public Transit',
      description: 'Self-driving buses and metro trains connecting all of Greater Sydney',
      stats: { usage: '3.2M rides/day', efficiency: '+42%', emissions: '-85%' },
      color: 'bg-blue-500',
    },
    {
      icon: Bike,
      title: 'Shared Micro-Mobility',
      description: 'E-bikes and scooters connecting ferry wharves to beach and suburb destinations',
      stats: { usage: '750K trips/day', efficiency: '+55%', emissions: '-98%' },
      color: 'bg-green-500',
    },
    {
      icon: Car,
      title: 'Electric Vehicle Network',
      description: 'EV charging from Penrith to Palm Beach with harbour tunnel integration',
      stats: { usage: '125K vehicles', efficiency: '+65%', emissions: '-92%' },
      color: 'bg-purple-500',
    },
    {
      icon: Plane,
      title: 'Urban Air Mobility',
      description: 'Electric air taxis connecting CBD to airport and coastal destinations',
      stats: { usage: '2.5K flights/day', efficiency: '+180%', emissions: '-88%' },
      color: 'bg-orange-500',
    },
  ];

  const infrastructureFeatures = [
    'Harbour Bridge and tunnel smart traffic reduces congestion by 45%',
    'Opal card integration across all transport modes',
    'Real-time routing considering harbour conditions and weather',
    'Carbon offset tracking for every Sydney journey',
    'Full accessibility compliance across all transport',
    'Predictive maintenance for ferries, trains, and buses',
  ];

  return (
    <section id="mobility" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sydney Smart Transport
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harbour-integrated transport connecting beaches to mountains, 
            with electric ferries, autonomous trains, and smart traffic management.
          </p>
        </div>

        {/* Mobility Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {mobilityOptions.map((option, index) => {
            const Icon = option.icon;
            
            return (
              <div
                key={option.title}
                className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-4 ${option.color} rounded-full`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{option.title}</h3>
                </div>
                
                <p className="text-gray-600 mb-6 leading-relaxed">{option.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{option.stats.usage}</div>
                    <div className="text-sm text-gray-600">Daily Usage</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{option.stats.efficiency}</div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{option.stats.emissions}</div>
                    <div className="text-sm text-gray-600">Emissions</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infrastructure Features */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <Navigation className="h-8 w-8 text-blue-400" />
                <h3 className="text-2xl font-bold">Intelligent Infrastructure</h3>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Our smart mobility network leverages AI, IoT, and real-time data to create 
                the most efficient and sustainable transportation system ever built.
              </p>
              <div className="flex items-center space-x-4">
                <Battery className="h-6 w-6 text-green-400" />
                <span className="text-gray-300">100% renewable energy powered</span>
              </div>
            </div>
            
            <div className="space-y-3">
              {infrastructureFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};