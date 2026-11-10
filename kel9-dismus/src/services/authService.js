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
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return { data: null, error: null };

    const profile = await fetchUserProfile(user.id);
    const formattedUser = formatUserData(user, profile);

    return { data: formattedUser, error: null };
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

    const profile = await fetchUserProfile(data.user.id);
    const formattedUser = formatUserData(data.user, profile);

    return {
      data: {
        ...data,
        user: formattedUser,
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