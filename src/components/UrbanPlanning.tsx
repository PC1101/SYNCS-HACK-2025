import React, { useState } from 'react';
import { Map, Building, Trees, Car, Home, Zap } from 'lucide-react';

export const UrbanPlanning: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('downtown');

  const districts = {
    downtown: {
      name: 'Sydney CBD',
      description: 'Global business district with harbour views and smart tower integration',
      features: ['Harbour-view vertical gardens', 'Smart traffic to bridge/tunnel', 'Underground rail logistics'],
      sustainability: 92,
      livability: 88,
      efficiency: 95,
    },
    residential: {
      name: 'Northern Beaches',
      description: 'Coastal sustainable communities with beach-access and net-zero homes',
      features: ['Solar beach suburbs', 'Community surf clubs', 'Ferry and bike hubs'],
      sustainability: 96,
      livability: 94,
      efficiency: 87,
    },
    innovation: {
      name: 'Tech Central',
      description: 'Camperdown-Ultimo innovation precinct with university partnerships',
      features: ['5G test networks', 'University research labs', 'Startup accelerators'],
      sustainability: 85,
      livability: 90,
      efficiency: 98,
    },
    industrial: {
      name: 'Western Sydney Hub',
      description: 'Advanced manufacturing precinct with airport connectivity',
      features: ['Waste-to-energy Blacktown', 'Automated port logistics', 'Clean aerospace manufacturing'],
      sustainability: 89,
      livability: 78,
      efficiency: 93,
    },
  };

  const planningPrinciples = [
    {
      icon: Building,
      title: 'Vertical Integration',
      description: 'Harbour-view towers combining living, working, and harbour recreation',
    },
    {
      icon: Trees,
      title: 'Green Infrastructure',
      description: 'Bushland corridors and harbour foreshore protection integrated citywide',
    },
    {
      icon: Car,
      title: 'Mobility First',
      description: '15-minute suburbs with ferry, light rail, and cycleway connectivity',
    },
    {
      icon: Home,
      title: 'Inclusive Housing',
      description: 'Affordable housing from Blacktown to Bondi for all Sydney workers',
    },
  ];

  return (
    <section id="planning" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sydney Urban Innovation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harbour-conscious development that balances Sydney's growth with heritage preservation, 
            creating world-class livable spaces from the beaches to the Blue Mountains.
          </p>
        </div>

        {/* Planning Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {planningPrinciples.map((principle, index) => {
            const Icon = principle.icon;
            
            return (
              <div
                key={principle.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4 bg-teal-100 rounded-full inline-block mb-4">
                  <Icon className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{principle.title}</h3>
                <p className="text-gray-600 leading-relaxed">{principle.description}</p>
              </div>
            );
          })}
        </div>

        {/* Interactive District Explorer */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-8">
              <Map className="h-8 w-8 text-teal-600" />
              <h3 className="text-2xl font-bold text-gray-900">District Explorer</h3>
            </div>

            {/* District Selector */}
            <div className="flex flex-wrap gap-3 mb-8">
              {Object.entries(districts).map(([key, district]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDistrict(key)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    selectedDistrict === key
                      ? 'bg-teal-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-teal-50 hover:text-teal-600'
                  }`}
                >
                  {district.name}
                </button>
              ))}
            </div>

            {/* Selected District Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {districts[selectedDistrict as keyof typeof districts].name}
                </h4>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {districts[selectedDistrict as keyof typeof districts].description}
                </p>
                
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-900">Key Features:</h5>
                  {districts[selectedDistrict as keyof typeof districts].features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-teal-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'Sustainability', value: districts[selectedDistrict as keyof typeof districts].sustainability, color: 'green' },
                  { label: 'Livability', value: districts[selectedDistrict as keyof typeof districts].livability, color: 'blue' },
                  { label: 'Efficiency', value: districts[selectedDistrict as keyof typeof districts].efficiency, color: 'teal' },
                ].map((metric, index) => (
                  <div key={metric.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className="text-sm text-gray-500">{metric.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${
                          metric.color === 'green' ? 'from-green-500 to-emerald-500' :
                          metric.color === 'blue' ? 'from-blue-500 to-indigo-500' :
                          'from-teal-500 to-cyan-500'
                        }`}
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};