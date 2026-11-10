import { supabase } from "../lib/supabase";

// ==========================================
// HELPER FUNCTIONS (Clean Code & DRY Principle)
// ==========================================

// Mengambil data profil dari tabel "profiles"
async function fetchUserProfile(userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, nama_lengkap, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return profile;
}

// Memformat objek user agar struktur metadata konsisten
function formatUserData(user, profile) {
  return {
    ...user,
    profile,
    user_metadata: {
      ...user.user_metadata,
      role: profile?.role || "pelanggan",
      full_name: profile?.nama_lengkap || user.user_metadata?.full_name || "",
    },
  };
}

// Memeriksa dan menambahkan profil baru jika belum ada saat registrasi
async function ensureUserProfileExists(user, fullName, email) {
  if (!user) return;

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) throw readError;

  if (!existing) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: email.trim().toLowerCase(),
        nama_lengkap: fullName.trim(),
        role: "pelanggan",
      });

    if (insertError) throw insertError;
  }
}

// ==========================================
// MAIN SERVICE FUNCTIONS
// ==========================================

// Mengambil pengguna yang sedang login
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// Ambil URL & Key dari file environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mengambil pengguna yang sedang login beserta profilnya
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return { data: null, error: null };

    const profile = await fetchUserProfile(user.id);
    const formattedUser = formatUserData(user, profile);

    return { data: formattedUser, error: null };
    if (profileError) throw profileError;

    const role = profile?.role || user.user_metadata?.role || "pelanggan";

    return {
      data: {
        ...user,
        profile,
        isOwnerOrManager: role === "owner" || role === "manager",
        user_metadata: {
          ...user.user_metadata,
          role,
          full_name: profile?.nama_lengkap || user.user_metadata?.full_name || "",
        },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
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

    const profile = await fetchUserProfile(data.user.id);
    const formattedUser = formatUserData(data.user, profile);

    return {
      data: {
        ...data,
        user: formattedUser,
      },
      error: null,
    };

    if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, nama_lengkap, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const role = profile?.role || data.user.user_metadata?.role || "pelanggan";

      data.user = {
        ...data.user,
        profile,
        isOwnerOrManager: role === "owner" || role === "manager",
        user_metadata: {
          ...data.user.user_metadata,
          role,
          full_name: profile?.nama_lengkap || data.user.user_metadata?.full_name || "",
        },
      };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Registrasi akun publik (Otomatis role: pelanggan)
export async function registerUser(email, password, fullName) {
  try {
    const cleanEmail = email.trim();
    const cleanFullName = fullName.trim();

    if (!cleanEmail || !password || !cleanFullName) {
      throw new Error("Nama, email, dan password wajib diisi.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          role: "pelanggan",
        },
      },
    });

    if (error) throw error;

    if (data.user && data.session) {
      await ensureUserProfileExists(data.user, cleanFullName, cleanEmail);
=======
    if (data?.user) {
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
>>>>>>> 4009293f48265d99d3319b51d2fd851a7bf86bc5
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fungsi khusus Manager/Owner untuk menambah user/karyawan tanpa mereset sesi Manajer di Navbar
export async function addUserByManager(email, password, fullName, role = "karyawan") {
  try {
    if (!email.trim() || !password || !fullName.trim()) {
      throw new Error("Semua kolom wajib diisi.");
    }

    // Client terisolasi agar TIDAK mengubah session/localStorage Manajer yang sedang login
    const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await tempClient.auth.signUp({
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

    if (data?.user) {
      // Gunakan client utama Manajer untuk memasukkan ke tabel profiles
      const { error: insertError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          username: email.trim().toLowerCase(),
          nama_lengkap: fullName.trim(),
          role,
        });

      if (insertError) throw insertError;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
// Fungsi untuk Login / Register menggunakan Google OAuth
export const loginWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, // Kembali ke URL aplikasi setelah login
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error Google Auth:", error.message);
    return { data: null, error };
  }
};

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