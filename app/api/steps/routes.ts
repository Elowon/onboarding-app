import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

// GET /api/steps -> fetch all steps for all user's tours
export async function GET() {
  const { data, error } = await supabase
    .from("steps")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// POST /api/steps -> create new step
export async function POST(req: Request) {
  const body = await req.json();

  const { tour_id, title, description, order } = body;

  const { data, error } = await supabase
    .from("steps")
    .insert([{ tour_id, title, description, order }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
