import React from 'react';
import { Thermometer, Wind, Sun, TreePine, Target, TrendingDown } from 'lucide-react';

export const ClimateAction: React.FC = () => {
  const climateMetrics = [
    {
      icon: Thermometer,
      title: 'Temperature Control',
      value: '+1.1°C',
      target: 'Target: +1.5°C max',
      status: 'on-track',
      description: 'Urban heat reduction through harbour breezes and green corridors',
    },
    {
      icon: Wind,
      title: 'Air Quality',
      value: 'Good (38 AQI)',
      target: 'Target: <50 AQI',
      status: 'achieved',
      description: 'Clean harbour air through electric ferries and coastal wind energy',
    },
    {
      icon: TreePine,
      title: 'Green Coverage',
      value: '47%',
      target: 'Target: 50%',
      status: 'on-track',
      description: 'Bushland preservation and green roofs from Hornsby to Sutherland',
    },
    {
      icon: TrendingDown,
      title: 'Emissions',
      value: '-72%',
      target: 'Target: -80% by 2030',
      status: 'on-track',
      description: 'Carbon reduction through harbour wind farms and solar initiatives',
    },
  ];

  const initiatives = [
    {
      title: 'Renewable Energy Transition',
      progress: 78,
      description: 'Offshore wind farms and rooftop solar powering 78% of Sydney operations',
      impact: '3.2M tons CO2 saved annually',
    },
    {
      title: 'Electric Transportation',
      progress: 65,
      description: 'Electric ferries, buses, and light rail connecting all of Greater Sydney',
      impact: '52% reduction in transport emissions',
    },
    {
      title: 'Circular Economy',
      progress: 82,
      description: 'Waste-to-energy in Western Sydney and harbour plastic recovery programs',
      impact: '85% waste diversion from Lucas Heights',
    },
    {
      title: 'Green Buildings',
      progress: 55,
      description: 'Net-zero towers in CBD and Parramatta with harbour-cooling systems',
      impact: '48% reduction in building emissions',
    },
  ];

  return (
    <section id="climate" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sydney Climate Resilience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Protecting Sydney's unique harbour environment and coastal communities 
            while building resilience against bushfires, floods, and rising sea levels.
          </p>
        </div>

        {/* Climate Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {climateMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const statusColor = 
              metric.status === 'achieved' ? 'text-green-600' :
              metric.status === 'on-track' ? 'text-blue-600' : 'text-orange-600';
            const bgColor = 
              metric.status === 'achieved' ? 'bg-green-100' :
              metric.status === 'on-track' ? 'bg-blue-100' : 'bg-orange-100';
            
            return (
              <div
                key={metric.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`p-3 rounded-full ${bgColor} mb-4 inline-block`}>
                  <Icon className={`h-6 w-6 ${statusColor}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{metric.title}</h3>
                <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                <div className={`text-sm font-medium mb-3 ${statusColor}`}>{metric.target}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{metric.description}</p>
              </div>
            );
          })}
        </div>

        {/* Climate Initiatives */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center space-x-3 mb-8">
            <Target className="h-8 w-8 text-green-600" />
            <h3 className="text-2xl font-bold text-gray-900">Active Climate Initiatives</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {initiatives.map((initiative, index) => (
              <div
                key={initiative.title}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-bold text-gray-900">{initiative.title}</h4>
                  <span className="text-2xl font-bold text-green-600">{initiative.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${initiative.progress}%` }}
                  ></div>
                </div>
                
                <p className="text-gray-600 mb-3 leading-relaxed">{initiative.description}</p>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4 text-green-500" />
                  <span className="text-green-700 font-semibold text-sm">{initiative.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};