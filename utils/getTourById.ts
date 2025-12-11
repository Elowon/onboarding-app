
import { supabase } from "@/utils/supabaseClient";

interface TourStep {
  id: string;
  order: number;
  title: string;
  content: string;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  steps: TourStep[];
}


export async function getTourById(tourId: string): Promise<Tour | null> {
  try {
    const { data, error } = await supabase
      .from("tours")
      .select("*, steps(*)")
      .eq("id", tourId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_id: data.user_id,
      steps: (data.steps || []).map((s: { id: string; title: string; content: string; order: number }) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        order: s.order,
      })),
    };
  } catch (err) {
    console.error("Failed to fetch tour:", err);
    return null;
  }
}
