import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabase
    .from("steps")
    .select("*")
    .eq("tour_id", id)
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
