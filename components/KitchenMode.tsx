import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Recipe } from "../types";

interface KitchenModeProps {
  recipe: Recipe;
  onBack: () => void;
}

export const KitchenMode: React.FC<KitchenModeProps> = ({ recipe, onBack }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const total = recipe.instructions.length;
  const currentStep = useMemo(() => recipe.instructions[stepIndex] ?? "", [recipe.instructions, stepIndex]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 p-6 text-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <h2 className="text-lg font-bold">Kitchen Mode</h2>
        <button onClick={onBack} className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800">
          <X size={18} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center text-center">
        <p className="mb-4 text-sm uppercase tracking-wider text-blue-300">
          Step {stepIndex + 1} of {total}
        </p>
        <p className="max-w-3xl text-2xl font-semibold leading-relaxed md:text-4xl">{currentStep}</p>
      </div>

      <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4">
        <button
          onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
          disabled={stepIndex === 0}
          className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 py-4 disabled:opacity-40"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          onClick={() => setStepIndex((s) => Math.min(total - 1, s + 1))}
          disabled={stepIndex >= total - 1}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-semibold text-white disabled:opacity-40"
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
