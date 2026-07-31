import React from 'react';

const Home = ({ title }) => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
    <div className="text-center p-8 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full">
      <h1 className="text-4xl font-extrabold text-indigo-400 mb-2">SmartServe</h1>
      <p className="text-xl text-slate-300 font-semibold">{title}</p>
      <div className="mt-6 inline-flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium">
        <span className="w-2 h-2 mr-2 bg-emerald-400 rounded-full animate-pulse"></span>
        System Scaffolding Ready
      </div>
    </div>
  </div>
);

export default Home;
