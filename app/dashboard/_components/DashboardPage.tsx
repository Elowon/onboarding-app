"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

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
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTourTitle, setNewTourTitle] = useState("");
  const [newTourDesc, setNewTourDesc] = useState("");

  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [editingTourTitle, setEditingTourTitle] = useState("");
  const [editingTourDesc, setEditingTourDesc] = useState("");

  const [newSteps, setNewSteps] = useState<{ [tourId: string]: { title: string; content: string } }>({});
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingStepTitle, setEditingStepTitle] = useState("");
  const [editingStepContent, setEditingStepContent] = useState("");

  const [addingTour, setAddingTour] = useState(false);
  const [addingStep, setAddingStep] = useState<{ [tourId: string]: boolean }>({});

 
  const fetchTours = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tours");
      const data: Tour[] = await res.json();
      setTours(data);
    } catch (err) {
      console.error("Failed to fetch tours:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  
  const handleAddTour = async () => {
    if (!newTourTitle.trim()) return;

    try {
      setAddingTour(true);
      const res = await fetch("/api/tours", {
        method: "POST",
        body: JSON.stringify({ name: newTourTitle, description: newTourDesc }),
      });
      const newTour: Tour = await res.json();
      newTour.steps = [];
      setTours([newTour, ...tours]);
      setNewTourTitle("");
      setNewTourDesc("");
    } catch (err) {
      console.error(err);
      alert("Failed to create tour");
    } finally {
      setAddingTour(false);
    }
  };

  
  const handleEditTour = (tour: Tour) => {
    setEditingTourId(tour.id);
    setEditingTourTitle(tour.title);
    setEditingTourDesc(tour.description);
  };

  const handleSaveTour = async (tourId: string) => {
    try {
      const res = await fetch(`/api/tours/${tourId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editingTourTitle, description: editingTourDesc }),
      });
      const updated: Tour = await res.json();
      setTours(tours.map((t) => (t.id === tourId ? { ...t, ...updated } : t)));
      setEditingTourId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save tour");
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm("Delete this tour?")) return;
    try {
      await fetch(`/api/tours/${tourId}`, { method: "DELETE" });
      setTours(tours.filter((t) => t.id !== tourId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete tour");
    }
  };


  const handleStepInputChange = (tourId: string, field: "title" | "content", value: string) => {
    setNewSteps((prev) => ({ ...prev, [tourId]: { ...prev[tourId], [field]: value } }));
  };

  const handleAddStep = async (tourId: string) => {
    const { title, content } = newSteps[tourId] || {};
    if (!title?.trim()) return;

    try {
      setAddingStep((prev) => ({ ...prev, [tourId]: true }));

      const res = await fetch("/api/steps", {
        method: "POST",
        body: JSON.stringify({ tour_id: tourId, title, content, order: (tours.find((t) => t.id === tourId)?.steps.length || 0) + 1 }),
      });
      const newStep: TourStep = await res.json();

      setTours((prev) =>
        prev.map((t) => (t.id === tourId ? { ...t, steps: [...t.steps, newStep] } : t))
      );

      setNewSteps((prev) => ({ ...prev, [tourId]: { title: "", content: "" } }));
    } catch (err) {
      console.error(err);
      alert("Failed to add step");
    } finally {
      setAddingStep((prev) => ({ ...prev, [tourId]: false }));
    }
  };

  const handleSaveStep = async (tourId: string, stepId: string) => {
    try {
      const res = await fetch(`/api/steps/${stepId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: editingStepTitle, content: editingStepContent }),
      });
      const updated: TourStep = await res.json();

      setTours((prev) =>
        prev.map((t) => t.id === tourId ? { ...t, steps: t.steps.map((s) => s.id === stepId ? updated : s) } : t)
      );

      setEditingStepId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save step");
    }
  };

  const handleDeleteStep = async (tourId: string, stepId: string) => {
    try {
      await fetch(`/api/steps/${stepId}`, { method: "DELETE" });
      setTours((prev) =>
        prev.map((t) => t.id === tourId ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) } : t)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete step");
    }
  };

  
  return (
    <div className="flex min-h-screen overflow-x-hidden text-white">
      <main className="h-screen flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 lg:text-5xl">
            Tour Manager
          </h2>

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
              {addingTour ? "Creating..." : <><Plus className="mr-2 inline h-4 w-4" /> Create Tour</>}
            </button>
          </div>

          
          {tours.map((tour) => (
            <div key={tour.id} className="rounded-2xl border border-white/10 bg-black/30 p-8">
              
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
                    <button onClick={() => handleSaveTour(tour.id)} className="rounded-lg bg-green-600 px-4 py-2">Save</button>
                    <button onClick={() => setEditingTourId(null)} className="rounded-lg bg-gray-700 px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{tour.title}</h3>
                    <p className="text-gray-300">{tour.description}</p>
                    <p className="mt-1 text-sm text-gray-400">{tour.steps.length} Steps</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditTour(tour)} className="rounded-lg border border-white/10 bg-blue-600/20 p-2">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteTour(tour.id)} className="rounded-lg border border-white/10 bg-red-600/20 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              
              <div className="mt-6 space-y-4">
                {tour.steps.map((step) => (
                  <div key={step.id} className="flex justify-between rounded-lg bg-gray-800/50 p-4">
                    {editingStepId === step.id ? (
                      <div className="flex-1 space-y-2">
                        <input className="w-full rounded bg-gray-700 p-2" value={editingStepTitle} onChange={(e) => setEditingStepTitle(e.target.value)} />
                        <textarea className="w-full rounded bg-gray-700 p-2" value={editingStepContent} onChange={(e) => setEditingStepContent(e.target.value)} rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveStep(tour.id, step.id)} className="rounded bg-green-600 px-3 py-1">Save</button>
                          <button onClick={() => setEditingStepId(null)} className="rounded bg-gray-600 px-3 py-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-between">
                        <div>
                          <p className="font-bold">{step.title}</p>
                          <p className="text-sm text-gray-300">{step.content}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingStepId(step.id); setEditingStepTitle(step.title); setEditingStepContent(step.content); }} className="rounded border border-white/10 bg-blue-600/20 p-2">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteStep(tour.id, step.id)} className="rounded border border-white/10 bg-red-600/20 p-2">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                
                <div className="mt-3 flex flex-col gap-2 md:flex-row">
                  <input placeholder="Step Title" className="flex-1 rounded bg-gray-700 p-2" value={newSteps[tour.id]?.title || ""} onChange={(e) => handleStepInputChange(tour.id, "title", e.target.value)} />
                  <input placeholder="Step Content" className="flex-1 rounded bg-gray-700 p-2" value={newSteps[tour.id]?.content || ""} onChange={(e) => handleStepInputChange(tour.id, "content", e.target.value)} />
                  <button onClick={() => handleAddStep(tour.id)} className="rounded-lg bg-cyan-600 px-4 py-2" disabled={addingStep[tour.id]}>
                    {addingStep[tour.id] ? "Adding..." : <><Plus className="mr-1 inline h-4 w-4" /> Add Step</>}
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
