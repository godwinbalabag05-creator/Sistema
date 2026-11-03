import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

const VehicleContext = createContext(null);
const STORAGE_KEY = "ekaniko.selectedVehicle";
const NOT_CONNECTED = { error: new Error("Supabase is not connected.") };

export function VehicleProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);

    supabase
      .from("vehicles")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (ignore) return;
        setVehicles(data ?? []);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  // Falls back to the first vehicle if nothing valid is selected
  const selectedVehicle =
    vehicles.find((v) => v.id === selectedId) ?? vehicles[0] ?? null;

  function selectVehicle(id) {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  async function addVehicle(values) {
    if (!supabase) return NOT_CONNECTED;

    const { data, error } = await supabase
      .from("vehicles")
      .insert({ ...values, owner_id: userId })
      .select()
      .single();

    if (error) return { error };

    setVehicles((current) => [...current, data]);
    selectVehicle(data.id);
    return { error: null };
  }

  async function updateVehicle(id, values) {
    if (!supabase) return NOT_CONNECTED;

    const { data, error } = await supabase
      .from("vehicles")
      .update(values)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    setVehicles((current) => current.map((v) => (v.id === id ? data : v)));
    return { error: null };
  }

  async function deleteVehicle(id) {
    if (!supabase) return NOT_CONNECTED;

    const { error } = await supabase.from("vehicles").delete().eq("id", id);

    if (error) return { error };

    setVehicles((current) => current.filter((v) => v.id !== id));
    return { error: null };
  }

  const value = {
    vehicles,
    selectedVehicle,
    loading,
    selectVehicle,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  return useContext(VehicleContext);
}