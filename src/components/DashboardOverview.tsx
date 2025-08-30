import React from 'react';
import { TrendingUp, TrendingDown, Activity, Users, Zap, Droplets } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const metrics = [
    {
      title: 'Energy Efficiency',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Water Conservation',
      value: '87.8%',
      change: '+1.5%',
      trend: 'up',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Population Density',
      value: '433/km²',
      change: '+0.8%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Air Quality Index',
      value: '42',
      change: '-8.2%',
      trend: 'down',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <section id="dashboard" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sydney Smart City Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time monitoring of Sydney's urban metrics from Parramatta to Bondi, 
            ensuring optimal performance across all council areas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
            const trendColor = metric.trend === 'up' ? 'text-green-600' : 'text-red-600';
            
            return (
              <div
                key={metric.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${metric.bgColor}`}>
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <div className={`flex items-center space-x-1 ${trendColor}`}>
                    <TrendIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{metric.change}</span>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</h3>
                <p className="text-gray-600 font-medium">{metric.title}</p>
              </div>
            );
          })}
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Real-time City Activity</h3>
          <div className="space-y-4">
            {[
              { time: '2 min ago', event: 'Harbour Bridge smart sensors optimized traffic flow by 12%', type: 'success' },
              { time: '5 min ago', event: 'Solar farms in Western Sydney reached 98% capacity', type: 'info' },
              { time: '8 min ago', event: 'Circular Quay waste management AI optimized collection routes', type: 'success' },
              { time: '12 min ago', event: 'Barangaroo remote work hub expanded to meet CBD demand', type: 'info' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className={`w-3 h-3 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{activity.event}</p>
                  <p className="text-gray-500 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};