import React from "react";

export const LoadingScreen: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-lg">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-lg font-semibold text-slate-800">{message}</p>
        <p className="mt-1 text-sm text-slate-500">PURE Chef is preparing your recipes...</p>
      </div>
    </div>
  );
};
