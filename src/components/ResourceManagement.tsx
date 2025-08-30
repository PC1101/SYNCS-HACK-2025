import React, { useState } from 'react';
import { Droplets, Zap, Trash2, Wifi, BarChart3, TrendingUp, Leaf } from 'lucide-react';

export const ResourceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('water');

  const resources = {
    water: {
      icon: Droplets,
      title: 'Water Management',
      usage: '78%',
      efficiency: '92%',
      savings: '8.7M litres/day',
      description: 'Desalination plants and harbour water management with AI-powered distribution across Greater Sydney.',
      features: [
        'Harbour water quality monitoring',
        'Desalination plant optimization',
        'Catchment area protection systems',
        'Smart water meters across all suburbs',
      ],
    },
    energy: {
      icon: Zap,
      title: 'Energy Grid',
      usage: '85%',
      efficiency: '96%',
      savings: '45% reduction in peak summer demand',
      description: 'Solar farms in Western Sydney and offshore wind integration with smart grid technology.',
      features: [
        'Rooftop solar across all suburbs',
        'Battery storage in Homebush',
        'Peak summer demand management',
        'Renewable energy certificates tracking',
      ],
    },
    waste: {
      icon: Trash2,
      title: 'Waste Systems',
      usage: '71%',
      efficiency: '89%',
      savings: '75% recycling rate',
      description: 'Circular economy with smart collection from Manly to Cronulla and advanced processing facilities.',
      features: [
        'Smart bins across all LGAs',
        'Automated sorting in Alexandria',
        'Organic waste processing',
        'Zero-waste pilot in Surry Hills',
      ],
    },
    connectivity: {
      icon: Wifi,
      title: 'Digital Infrastructure',
      usage: '99%',
      efficiency: '98%',
      savings: '5G coverage from Penrith to Sutherland',
      description: 'NBN Co partnership delivering ultra-fast connectivity across Greater Sydney.',
      features: [
        '5G towers across all suburbs',
        'Fibre optic to every building',
        'Free WiFi in all public spaces',
        'Edge computing in CBD and Parramatta',
      ],
    },
  };

  const resourceKeys = Object.keys(resources) as Array<keyof typeof resources>;

  return (
    <section id="resources" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sydney Resource Optimization
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Managing Sydney's precious resources from the Blue Mountains to Botany Bay through 
            AI-driven optimization and harbour-conscious monitoring systems.
          </p>
        </div>

        {/* Resource Tabs */}
        <div className="flex flex-wrap justify-center mb-8 gap-2">
          {resourceKeys.map((key) => {
            const resource = resources[key];
            const Icon = resource.icon;
            const isActive = activeTab === key;
            
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{resource.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Resource Details */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  {React.createElement(resources[activeTab as keyof typeof resources].icon, {
                    className: 'h-8 w-8 text-emerald-600',
                  })}
                  <h3 className="text-2xl font-bold text-gray-900">
                    {resources[activeTab as keyof typeof resources].title}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  {resources[activeTab as keyof typeof resources].description}
                </p>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Key Features:</h4>
                  <ul className="space-y-2">
                    {resources[activeTab as keyof typeof resources].features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl">
                    <BarChart3 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {resources[activeTab as keyof typeof resources].usage}
                    </div>
                    <div className="text-sm text-gray-600">Current Usage</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {resources[activeTab as keyof typeof resources].efficiency}
                    </div>
                    <div className="text-sm text-gray-600">Efficiency</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-gray-900">
                      {resources[activeTab as keyof typeof resources].savings}
                    </div>
                    <div className="text-sm text-gray-600">Savings</div>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Optimization Level</span>
                      <span className="text-sm text-gray-500">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-[94%] transition-all duration-1000"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Sustainability Score</span>
                      <span className="text-sm text-gray-500">88%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-[88%] transition-all duration-1000"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};