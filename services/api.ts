/**
 * PureChef API service – auth, recipes, pantry, AI
 * Uses backend at VITE_API_URL (default http://localhost:3001/api)
 */

function getApiBase(): string {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  if (!url.startsWith('http')) url = 'https://' + url.replace(/^\//, '');
  if (!url.endsWith('/api')) url = url.replace(/\/?$/, '') + '/api';
  return url;
}
const API_BASE = getApiBase();

function getToken(): string | null {
  return localStorage.getItem('purechef_token');
}

async function request<T>(
  path: string,
  options: RequestInit & { body?: unknown } = {}
): Promise<T> {
  const { body, ...init } = options;
  const headers: HeadersInit = {
    ...(init.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed: ${res.status}`;
    if (typeof msg === 'string' && msg.toLowerCase().includes('invalid token')) {
      localStorage.removeItem('purechef_token');
      localStorage.removeItem('purechef_user');
      if (typeof window !== 'undefined') window.location.reload();
    }
    throw new Error(msg);
  }
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  token: string;
  message?: string;
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: { email, password },
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout(): void {
  localStorage.removeItem('purechef_token');
  localStorage.removeItem('purechef_user');
}

// ─── AI ──────────────────────────────────────────────────────

export async function detectIngredientsFromImage(imageBase64: string): Promise<string[]> {
  const data = await request<{ success: boolean; ingredients: string[] }>(
    '/ai/detect-ingredients-base64',
    { method: 'POST', body: { imageBase64 } }
  );
  return data.ingredients || [];
}

export interface GenerateRecipesV2Params {
  ingredients: string[];
  mode?: string;
  emotion?: string;
  tasteProfile?: Record<string, unknown>;
  /** Skip AI image generation for faster response (uses placeholders) */
  skipImages?: boolean;
}

export async function generateRecipesV2(
  params: GenerateRecipesV2Params
): Promise<{ success: boolean; recipes: unknown[] }> {
  return request('/ai/generate-recipes-v2', {
    method: 'POST',
    body: params,
  });
}

export async function generateRecipeImage(recipeTitle: string): Promise<string> {
  const data = await request<{ success: boolean; imageUrl: string }>(
    '/ai/generate-recipe-image',
    { method: 'POST', body: { title: recipeTitle } }
  );
  return data.imageUrl || '';
}

// ─── Recipes ─────────────────────────────────────────────────

export interface BackendRecipe {
  _id: string;
  title: string;
  description?: string;
  time?: string;
  prepTime?: string;
  calories?: string | number;
  protein?: string;
  carbs?: string;
  ingredients?: { name: string; amount?: string; isMissing?: boolean }[];
  instructions?: string[];
  imageUrl?: string;
  nutrition_total?: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  nutrition_per_serving?: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  servings_count?: number;
  nutrition_source?: string;
  is_estimated?: boolean;
  createdAt?: string;
}

export interface SaveRecipeBody {
  title: string;
  description?: string;
  time?: string;
  prepTime?: string;
  calories?: string | number;
  protein?: string;
  carbs?: string;
  ingredients?: { name: string; amount?: string; isMissing?: boolean }[];
  instructions?: string[];
  imageUrl?: string;
  nutrition_total?: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  nutrition_per_serving?: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  servings_count?: number;
  nutrition_source?: string;
  is_estimated?: boolean;
}

export async function getRecipes(): Promise<{ success: boolean; recipes: BackendRecipe[] }> {
  return request('/recipes/');
}

export async function saveRecipe(recipe: SaveRecipeBody): Promise<{ success: boolean; message?: string }> {
  const payload = mapRecipeToBackend(recipe);
  return request('/recipes/save-recipe', { method: 'POST', body: payload });
}

export async function deleteRecipe(id: string): Promise<{ success: boolean; message?: string }> {
  return request(`/recipes/${id}`, { method: 'DELETE' });
}

/** Map frontend Recipe to backend payload */
function mapRecipeToBackend(recipe: SaveRecipeBody): Record<string, unknown> {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    time: recipe.time ?? recipe.prepTime ?? '',
    prepTime: recipe.prepTime ?? recipe.time ?? '',
    calories: recipe.calories ?? 0,
    protein: recipe.protein ?? '',
    carbs: recipe.carbs ?? '',
    ingredients: recipe.ingredients ?? [],
    instructions: recipe.instructions ?? [],
    imageUrl: recipe.imageUrl,
    nutrition_total: recipe.nutrition_total,
    nutrition_per_serving: recipe.nutrition_per_serving,
    servings_count: recipe.servings_count ?? 4,
    nutrition_source: recipe.nutrition_source ?? 'estimated',
    is_estimated: recipe.is_estimated ?? true,
  };
}

/** Normalize API recipe (from generate or backend) to frontend Recipe */
export function normalizeRecipe(r: Record<string, unknown>): {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  calories: number;
  ingredients: { name: string; amount: string; isMissing: boolean }[];
  instructions: string[];
  imageUrl?: string;
  nutrition_total: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  nutrition_per_serving: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  servings_count: number;
  nutrition_source: string;
  is_estimated: boolean;
} {
  const num = (v: unknown): number =>
    typeof v === 'number' ? v : typeof v === 'string' ? parseInt(String(v), 10) || 0 : 0;
  const defNutrition = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  const ing = (r.ingredients as { name?: string; amount?: string; isMissing?: boolean }[]) ?? [];
  return {
    id: String(r.id ?? r._id ?? ''),
    title: String(r.title ?? ''),
    description: String(r.description ?? ''),
    prepTime: String(r.prepTime ?? r.time ?? ''),
    calories: num(r.calories),
    ingredients: ing.map((i) => ({
      name: String(i.name ?? ''),
      amount: String(i.amount ?? ''),
      isMissing: !!i.isMissing,
    })),
    instructions: Array.isArray(r.instructions) ? r.instructions.map(String) : [],
    imageUrl: r.imageUrl as string | undefined,
    nutrition_total: (r.nutrition_total as Record<string, number>) ?? defNutrition,
    nutrition_per_serving: (r.nutrition_per_serving as Record<string, number>) ?? defNutrition,
    servings_count: num(r.servings_count) || 4,
    nutrition_source: String(r.nutrition_source ?? 'estimated'),
    is_estimated: !!r.is_estimated,
  };
}

/** Map backend recipe to frontend Recipe shape */
export function mapBackendToRecipe(r: BackendRecipe): {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  calories: number;
  ingredients: { name: string; amount: string; isMissing: boolean }[];
  instructions: string[];
  imageUrl?: string;
  nutrition_total: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  nutrition_per_serving: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  servings_count: number;
  nutrition_source: string;
  is_estimated: boolean;
} {
  const num = (v: unknown): number =>
    typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) || 0 : 0;
  const defNutrition = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  return {
    id: r._id,
    title: r.title,
    description: r.description ?? '',
    prepTime: r.prepTime ?? r.time ?? '',
    calories: num(r.calories),
    ingredients: (r.ingredients ?? []).map((i) => ({
      name: i.name ?? '',
      amount: i.amount ?? '',
      isMissing: !!i.isMissing,
    })),
    instructions: r.instructions ?? [],
    imageUrl: r.imageUrl,
    nutrition_total: r.nutrition_total ?? defNutrition,
    nutrition_per_serving: r.nutrition_per_serving ?? defNutrition,
    servings_count: r.servings_count ?? 4,
    nutrition_source: r.nutrition_source ?? 'estimated',
    is_estimated: r.is_estimated ?? true,
  };
}

// ─── Pantry ──────────────────────────────────────────────────

export async function getPantry(): Promise<{ success: boolean; items: { _id: string; name: string }[] }> {
  return request('/pantry/');
}

export async function addToPantry(ingredients: string[]): Promise<{ success: boolean; message?: string }> {
  return request('/pantry/', { method: 'POST', body: { ingredients } });
}

export async function deletePantryItem(id: string): Promise<{ success: boolean; message?: string }> {
  return request(`/pantry/${id}`, { method: 'DELETE' });
}
