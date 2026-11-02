
import { supabase } from "../lib/supabase";

// Mendapatkan user yang sedang login
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return {
      data: data.user,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

// Login menggunakan email dan password
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

// Registrasi akun baru
export async function registerUser(
  email,
  password,
  fullName,
  role = "pelanggan"
) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
        },
      },
    });

    if (error) throw error;

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

// Logout pengguna
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return {
      error: null,
    };
  } catch (error) {
    return {
      error,
    };
  }
}
