import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";


export async function GET() {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}


export async function POST(req: Request) {
  const body = await req.json();

  const { name, description } = body;

  const { data, error } = await supabase
    .from("tours")
    .insert([{ name, description }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
