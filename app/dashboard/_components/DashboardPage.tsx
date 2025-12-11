"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

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
  steps: TourStep[];
  user_id?: string;
}

interface SupabaseStepRow {
  id: string;
  title: string;
  content: string;
  order: number;
  tour_id: string;
}

interface SupabaseTourRow {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  steps?: SupabaseStepRow[];
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [newTourTitle, setNewTourTitle] = useState("");
  const [newTourDesc, setNewTourDesc] = useState("");

  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [editingTourTitle, setEditingTourTitle] = useState("");
  const [editingTourDesc, setEditingTourDesc] = useState("");

  const [newSteps, setNewSteps] = useState<{
    [tourId: string]: { title: string; content: string };
  }>({});

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const [editingStepContent, setEditingStepContent] = useState("");
  const [addingTour, setAddingTour] = useState(false);
  const [addingStep, setAddingStep] = useState<{ [tourId: string]: boolean }>(
    {},
  );

  // ---------------- Fetch tours function ----------------
  const fetchTours = async (currentUser: User) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tours")
        .select("*, steps(*)")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted: Tour[] = (data as SupabaseTourRow[]).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        created_at: t.created_at,
        updated_at: t.updated_at,
        user_id: t.user_id,
        steps: (t.steps || []).map((s: SupabaseStepRow) => ({
          id: s.id,
          title: s.title,
          content: s.content,
          order: s.order,
        })),
      }));

      setTours(formatted);
    } catch (err) {
      console.error("Error fetching tours:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Auth & initial fetch ----------------
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) await fetchTours(currentUser);
      else setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchTours(currentUser);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ---------------- Add Tour ----------------
  const handleAddTour = async () => {
    if (!user || !newTourTitle.trim()) return;

    try {
      setAddingTour(true);

      const { data: tour, error } = await supabase
        .from("tours")
        .insert([
          {
            title: newTourTitle,
            description: newTourDesc,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTours([{ ...(tour as SupabaseTourRow), steps: [] }, ...tours]);
      setNewTourTitle("");
      setNewTourDesc("");
    } catch (err) {
      console.error(err);
      alert("Failed to create tour");
    } finally {
      setAddingTour(false);
    }
  };

  // Edit tour
  const handleEditTour = (tour: Tour) => {
    setEditingTourId(tour.id);
    setEditingTourTitle(tour.title);
    setEditingTourDesc(tour.description || "");
  };

  const handleSaveTour = async (id: string) => {
    try {
      const { data: updated, error } = await supabase
        .from("tours")
        .update({
          title: editingTourTitle,
          description: editingTourDesc,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setTours(
        tours.map((t) =>
          t.id === id ? { ...(updated as SupabaseTourRow), steps: t.steps } : t,
        ),
      );

      setEditingTourId(null);
      setEditingTourTitle("");
      setEditingTourDesc("");
    } catch (err) {
      console.error(err);
      alert("Failed to update tour");
    }
  };

  const handleDeleteTour = async (id: string) => {
    if (!confirm("Delete this tour?")) return;

    try {
      await supabase.from("steps").delete().eq("tour_id", id);
      await supabase.from("tours").delete().eq("id", id);
      setTours(tours.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete tour");
    }
  };

  const handleStepInputChange = (
    tourId: string,
    field: "title" | "content",
    value: string,
  ) => {
    setNewSteps((prev) => ({
      ...prev,
      [tourId]: { ...prev[tourId], [field]: value },
    }));
  };

  const handleAddStep = async (tourId: string) => {
    const { title, content } = newSteps[tourId] || {};
    if (!title?.trim()) return;

    try {
      setAddingStep((prev) => ({ ...prev, [tourId]: true })); // start loading

      const parentTour = tours.find((t) => t.id === tourId);

      const { data: step, error } = await supabase
        .from("steps")
        .insert([
          {
            tour_id: tourId,
            title,
            content,
            order: (parentTour?.steps.length || 0) + 1,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const formatted: TourStep = {
        id: (step as SupabaseStepRow).id,
        title: (step as SupabaseStepRow).title,
        content: (step as SupabaseStepRow).content,
        order: (step as SupabaseStepRow).order,
      };

      setTours(
        tours.map((t) =>
          t.id === tourId ? { ...t, steps: [...t.steps, formatted] } : t,
        ),
      );

      setNewSteps((prev) => ({
        ...prev,
        [tourId]: { title: "", content: "" },
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to add step");
    } finally {
      setAddingStep((prev) => ({ ...prev, [tourId]: false })); // stop loading
    }
  };

  const handleSaveStep = async (tourId: string, stepId: string) => {
    try {
      const { data: updated, error } = await supabase
        .from("steps")
        .update({
          title: editingStepTitle,
          content: editingStepContent,
        })
        .eq("id", stepId)
        .select()
        .single();

      if (error) throw error;

      const row = updated as SupabaseStepRow;

      setTours(
        tours.map((t) =>
          t.id === tourId
            ? {
                ...t,
                steps: t.steps.map((s) =>
                  s.id === stepId
                    ? {
                        id: row.id,
                        title: row.title,
                        content: row.content,
                        order: row.order,
                      }
                    : s,
                ),
              }
            : t,
        ),
      );

      setEditingStepId(null);
      setEditingStepTitle("");
      setEditingStepContent("");
    } catch (err) {
      console.error(err);
      alert("Failed to update step");
    }
  };

  const handleDeleteStep = async (tourId: string, stepId: string) => {
    try {
      await supabase.from("steps").delete().eq("id", stepId);

      setTours(
        tours.map((t) =>
          t.id === tourId
            ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) }
            : t,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete step");
    }
  };

  useEffect(() => {
    console.log("Fetched tours:", tours);
  }, [tours]);

  return (
    <div className="flex min-h-screen overflow-x-hidden text-white">
      <main className="h-screen flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-3xl font-bold text-transparent lg:text-5xl">
                Tour Manager
              </h2>
              <p className="mt-2 text-gray-100">
                Create and manage your interactive tours
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="rounded-xl border border-[var(--color-darker)] bg-[var(--color-light-black)] p-3">
                <span className="font-bold text-cyan-300">{tours.length}</span>
                <span className="ml-2 text-gray-100">Tours</span>
              </div>
              <div className="rounded-xl border border-[var(--color-darker)] bg-[var(--color-light-black)] p-3">
                <span className="font-bold text-purple-300">
                  {tours.reduce(
                    (acc, tour) => acc + (tour.steps?.length ?? 0),
                    0,
                  )}
                </span>
                <span className="ml-2 text-gray-100">Steps</span>
              </div>
              <div className="rounded-xl border border-[var(--color-darker)] bg-[var(--color-light-black)] p-3">
                <span className="font-bold text-pink-300">Just Now</span>
                <span className="ml-2 text-gray-100">Last Updated</span>
              </div>
            </div>
          </div>

          {/* Create New Tour */}
          <div className="rounded-2xl border border-white/10 bg-black/40 p-8">
            <h3 className="mb-4 text-xl font-bold">Create New Tour</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                placeholder="Tour Title"
                className="rounded-lg border border-white/10 bg-gray-800 p-3"
                value={newTourTitle}
                onChange={(e) => setNewTourTitle(e.target.value)}
              />
              <input
                placeholder="Tour Description"
                className="rounded-lg border border-white/10 bg-gray-800 p-3"
                value={newTourDesc}
                onChange={(e) => setNewTourDesc(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddTour}
              className="mt-4 rounded-xl bg-cyan-600 px-6 py-3"
              disabled={addingTour}
            >
              {addingTour ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="mr-2 inline h-4 w-4" /> Create Tour
                </>
              )}
            </button>
          </div>

          {/* Tours List */}
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-8"
            >
              {editingTourId === tour.id ? (
                <div className="space-y-3">
                  <input
                    className="w-full rounded-lg border border-white/10 bg-gray-800 p-3"
                    value={editingTourTitle}
                    onChange={(e) => setEditingTourTitle(e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-white/10 bg-gray-800 p-3"
                    value={editingTourDesc}
                    onChange={(e) => setEditingTourDesc(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTour(tour.id)}
                      className="rounded-lg bg-green-600 px-4 py-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTourId(null)}
                      className="rounded-lg bg-gray-700 px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{tour.title}</h3>
                    <p className="text-gray-300">{tour.description}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      {tour.steps.length} Steps
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTour(tour)}
                      className="rounded-lg border border-white/10 bg-blue-600/20 p-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTour(tour.id)}
                      className="rounded-lg border border-white/10 bg-red-600/20 p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {/* Copy Embed Code Button */}
                    <button
                      onClick={() => {
                        const embedCode = `<script data-id="${tour.id}" src="https://tours-embed-widget-vite.vercel.app/main.iife.js"></script>`;
                        navigator.clipboard.writeText(embedCode);
                        alert("Embed code copied to clipboard!");
                      }}
                      className="rounded-lg border border-white/10 bg-purple-600/20 p-2"
                    >
                      Copy Embed Code
                    </button>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="mt-6 space-y-4">
                {tour.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex justify-between rounded-lg bg-gray-800/50 p-4"
                  >
                    {editingStepId === step.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          className="w-full rounded bg-gray-700 p-2"
                          value={editingStepTitle}
                          onChange={(e) => setEditingStepTitle(e.target.value)}
                        />
                        <textarea
                          className="w-full rounded bg-gray-700 p-2"
                          value={editingStepContent}
                          onChange={(e) =>
                            setEditingStepContent(e.target.value)
                          }
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveStep(tour.id, step.id)}
                            className="rounded bg-green-600 px-3 py-1"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingStepId(null)}
                            className="rounded bg-gray-600 px-3 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="font-bold">{step.title}</p>
                          <p className="text-sm text-gray-300">
                            {step.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingStepId(step.id);
                              setEditingStepTitle(step.title);
                              setEditingStepContent(step.content);
                            }}
                            className="rounded border border-white/10 bg-blue-600/20 p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(tour.id, step.id)}
                            className="rounded border border-white/10 bg-red-600/20 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Add new step */}
                <div className="mt-3 flex flex-col gap-2 md:flex-row">
                  <input
                    placeholder="Step Title"
                    className="flex-1 rounded bg-gray-700 p-2"
                    value={newSteps[tour.id]?.title || ""}
                    onChange={(e) =>
                      handleStepInputChange(tour.id, "title", e.target.value)
                    }
                  />
                  <input
                    placeholder="Step Content"
                    className="flex-1 rounded bg-gray-700 p-2"
                    value={newSteps[tour.id]?.content || ""}
                    onChange={(e) =>
                      handleStepInputChange(tour.id, "content", e.target.value)
                    }
                  />
                  <button
                    onClick={() => handleAddStep(tour.id)}
                    className="rounded-lg bg-cyan-600 px-4 py-2"
                    disabled={addingStep[tour.id]}
                  >
                    {addingStep[tour.id] ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="mr-1 inline h-4 w-4" /> Add Step
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
