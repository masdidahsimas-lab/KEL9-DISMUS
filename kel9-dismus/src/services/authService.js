
import { supabase } from "../lib/supabase";

// Mengambil pengguna yang sedang login
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return { data: null, error: null };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, nama_lengkap, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    return {
      data: {
        ...user,
        profile,
        user_metadata: {
          ...user.user_metadata,
          role: profile?.role || "pelanggan",
          full_name: profile?.nama_lengkap || user.user_metadata?.full_name || "",
        },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Login pengguna
export async function loginUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, nama_lengkap, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    return {
      data: {
        ...data,
        user: {
          ...data.user,
          profile,
          user_metadata: {
            ...data.user.user_metadata,
            role: profile?.role || "pelanggan",
            full_name: profile?.nama_lengkap || "",
          },
        },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

// Registrasi pelanggan
export async function registerUser(email, password, fullName) {
  try {
    if (!email.trim() || !password || !fullName.trim()) {
      throw new Error("Nama, email, dan password wajib diisi.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role: "pelanggan",
        },
      },
    });

    if (error) throw error;

    if (data.user && data.session) {
      const { data: existing, error: readError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (readError) throw readError;

      if (!existing) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            username: email.trim().toLowerCase(),
            nama_lengkap: fullName.trim(),
            role: "pelanggan",
          });

        if (insertError) throw insertError;
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Logout pengguna
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
}
