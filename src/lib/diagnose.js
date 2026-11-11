import { supabase } from "./supabaseClient";

export async function diagnose(messages, vehicle, image = null) {
  if (!supabase) throw new Error("Supabase is not connected.");

  const { data, error } = await supabase.functions.invoke("diagnose", {
    body: { messages, vehicle, image },
  });

  if (error) {
    let message = error.message;

    try {
      const body = await error.context.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the default message
    }

    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);

  return data;
}