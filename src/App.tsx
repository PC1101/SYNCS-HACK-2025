import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DashboardOverview } from './components/DashboardOverview';
import { ResourceManagement } from './components/ResourceManagement';
import { FutureWork } from './components/FutureWork';
import { ClimateAction } from './components/ClimateAction';
import { UrbanPlanning } from './components/UrbanPlanning';
import { SmartMobility } from './components/SmartMobility';
import { Footer } from './components/Footer';
import { AverageRainfall } from "./components/AverageRainfall";
// ...

function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Hero />
            <DashboardOverview />
            <ResourceManagement />
            <ClimateAction />
            <AverageRainfall />
            <UrbanPlanning />


            <Footer />
        </div>
    );
}

export default App;