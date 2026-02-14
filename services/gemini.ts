import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, RecipeEmotion, RecipeMode, TasteProfile } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const detectIngredientsFromImage = async (base64Image: string): Promise<string[]> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: "List visible edible ingredients only. Return comma-separated values.",
        },
      ],
    },
  });

  return (response.text || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

export const generateRecipes = async (
  ingredients: string[],
  mode: RecipeMode = "STANDARD",
  emotion: RecipeEmotion = "COMFORT",
  tasteProfile?: TasteProfile
): Promise<Recipe[]> => {
  const ai = getAI();

  const prompt = `
You are a chef assistant. Generate exactly 3 recipes as JSON array.
Ingredients available: ${ingredients.join(", ")}.
Mode: ${mode}. Emotion: ${emotion}.
Taste memory: ${JSON.stringify(tasteProfile || {})}.

Requirements:
- clear title, description, prepTime, calories
- include ingredients with amount and isMissing
- include instructions
- include nutrition_total and nutrition_per_serving with calories/protein_g/carbs_g/fat_g
- include servings_count, nutrition_source, is_estimated
- mark at least one recipe with exactly one missing ingredient if possible.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prepTime: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            servings_count: { type: Type.NUMBER },
            nutrition_source: { type: Type.STRING },
            is_estimated: { type: Type.BOOLEAN },
            nutrition_total: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER },
              },
            },
            nutrition_per_serving: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER },
              },
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  isMissing: { type: Type.BOOLEAN },
                },
                required: ["name", "amount", "isMissing"],
              },
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "title",
            "description",
            "prepTime",
            "calories",
            "ingredients",
            "instructions",
            "nutrition_total",
            "nutrition_per_serving",
            "servings_count",
          ],
        },
      },
    },
  });

  const parsed = JSON.parse(response.text || "[]") as Recipe[];
  return parsed.map((recipe, idx) => ({ ...recipe, id: `recipe-${idx}` }));
};

export const generateRecipeImage = async (recipeTitle: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: `Minimal overhead food photo of ${recipeTitle}, clean composition, high quality.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return `https://picsum.photos/seed/${encodeURIComponent(recipeTitle)}/600/600`;
};
