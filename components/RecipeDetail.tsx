import React from "react";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Recipe, FeedbackType } from "../types";

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onStartKitchen: () => void;
  onFeedback: (recipeTitle: string, type: FeedbackType) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack,
  onStartKitchen,
  onFeedback,
}) => {
  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h2 className="text-3xl font-bold text-slate-900">{recipe.title}</h2>
      <p className="mt-2 text-slate-600">{recipe.description}</p>

      <div className="mt-4 text-sm text-slate-500">
        Prep: {recipe.prepTime} | Calories: {recipe.calories}
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Ingredients</h3>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-700">
                {ing.isMissing ? (
                  <AlertCircle size={16} className="mt-0.5 text-amber-500" />
                ) : (
                  <CheckCircle size={16} className="mt-0.5 text-emerald-500" />
                )}
                <span>
                  <strong>{ing.amount}</strong> {ing.name}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Instructions</h3>
          <ol className="list-decimal space-y-2 pl-5 text-slate-700">
            {recipe.instructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={onStartKitchen}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Start Kitchen Mode
        </button>
        <button
          onClick={() => onFeedback(recipe.title, "LOVED")}
          className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-50"
        >
          Loved it
        </button>
        <button
          onClick={() => onFeedback(recipe.title, "OKAY")}
          className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-50"
        >
          It was okay
        </button>
        <button
          onClick={() => onFeedback(recipe.title, "DISLIKED")}
          className="rounded-xl border border-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-50"
        >
          Not for me
        </button>
      </div>
    </div>
  );
};
