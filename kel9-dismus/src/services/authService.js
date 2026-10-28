import { supabase } from "../lib/supabase";

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { data: user, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function registerUser(email, password, fullName, role = "pelanggan") {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}