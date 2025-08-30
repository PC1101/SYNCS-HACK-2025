import React from 'react';
import { ArrowRight, Zap, Leaf, Users } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Sydney of the
            <span className="block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Future
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            Transforming Sydney into a world-leading smart city through sustainable technology, 
            harbour-conscious development, and innovative solutions for Australia's global city.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg">
              <span>Explore Solutions</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="border-2 border-emerald-400 text-emerald-100 hover:bg-emerald-400 hover:text-emerald-900 px-8 py-4 rounded-full font-semibold transition-all duration-300">
              View Dashboard
            </button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <Zap className="h-12 w-12 text-yellow-400 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold mb-2">50% Energy Savings</h3>
              <p className="text-emerald-200">Through smart grid optimization</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <Leaf className="h-12 w-12 text-green-400 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold mb-2">Carbon Neutral</h3>
              <p className="text-emerald-200">Achieving net-zero emissions by 2030</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <Users className="h-12 w-12 text-blue-400 mb-4 mx-auto" />
              <h3 className="text-2xl font-bold mb-2">100% Connected</h3>
              <p className="text-emerald-200">Seamless remote work infrastructure</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};