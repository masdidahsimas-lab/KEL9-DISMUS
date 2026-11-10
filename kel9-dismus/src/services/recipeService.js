import { supabase } from "../lib/supabase";

// 1. Fetch Menu + Hitung Estimasi Porsi dari Stok Bahan Tersedia
export async function getMenusWithPortions() {
  const { data: menus, error } = await supabase
    .from("menus")
    .select(`
      *,
      menu_bahan_baku (
        id,
        menu_id,
        bahan_id,
        jumlah_dibutuhkan,
        stok_bahan_baku (
          id,
          nama_bahan,
          jumlah_stok,
          satuan
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (menus || []).map((menu) => {
    const resep = menu.menu_bahan_baku || [];
    const pcsAdonan = Number(menu.pcs_per_adonan);
    const pcsPorsi = Number(menu.pcs_per_porsi);

    if (resep.length === 0 || !pcsAdonan || !pcsPorsi) {
      return {
        ...menu,
        estimasi_porsi: 0,
        has_recipe: resep.length > 0 && pcsAdonan > 0 && pcsPorsi > 0,
      };
    }

    const porsiPerAdonan = pcsAdonan / pcsPorsi;

    const adonanTersediaPerBahan = resep.map((item) => {
      const stokTersedia = Number(item.stok_bahan_baku?.jumlah_stok || 0);
      const butuhPerAdonan = Number(item.jumlah_dibutuhkan || 0);

      if (butuhPerAdonan <= 0) return 0;
      return stokTersedia / butuhPerAdonan;
    });

    const adonanTersedia = Math.min(...adonanTersediaPerBahan);
    const totalPorsi = Math.floor(adonanTersedia * porsiPerAdonan);

    return {
      ...menu,
      estimasi_porsi: totalPorsi < 0 ? 0 : totalPorsi,
      has_recipe: true,
    };
  });
}

// 2. Simpan Resep & Kurangi Stok Bahan Baku di Gudang Secara Otomatis
export async function saveMenuRecipe(menuId, recipeItems, configData = {}, potongStok = true) {
  // Update setting pcs adonan & porsi di tabel menus
  const { error: menuError } = await supabase
    .from("menus")
    .update({
      pcs_per_adonan: Number(configData.pcs_per_adonan),
      pcs_per_porsi: Number(configData.pcs_per_porsi),
    })
    .eq("id", menuId);

  if (menuError) throw menuError;

  // Jika opsi potong stok aktif, kurangi stok_bahan_baku secara otomatis
  if (potongStok && recipeItems && recipeItems.length > 0) {
    for (const item of recipeItems) {
      const bahanId = Number(item.bahan_id);
      const butuh = Number(item.jumlah_dibutuhkan);

      // Ambil stok saat ini
      const { data: bahanCurrent } = await supabase
        .from("stok_bahan_baku")
        .select("jumlah_stok")
        .eq("id", bahanId)
        .single();

      if (bahanCurrent) {
        const stokLama = Number(bahanCurrent.jumlah_stok || 0);
        const stokBaru = Math.max(0, stokLama - butuh);

        await supabase
          .from("stok_bahan_baku")
          .update({ jumlah_stok: stokBaru, updated_at: new Date().toISOString() })
          .eq("id", bahanId);
      }
    }
  }

  // Hapus mapping resep lama
  const { error: deleteError } = await supabase
    .from("menu_bahan_baku")
    .delete()
    .eq("menu_id", menuId);

  if (deleteError) throw deleteError;

  if (!recipeItems || recipeItems.length === 0) return true;

  // Insert mapping resep baru
  const rowsToInsert = recipeItems.map((item) => ({
    menu_id: menuId,
    bahan_id: Number(item.bahan_id),
    jumlah_dibutuhkan: Number(item.jumlah_dibutuhkan),
  }));

  const { error: insertError } = await supabase
    .from("menu_bahan_baku")
    .insert(rowsToInsert);

  if (insertError) throw insertError;

  return true;
}

// 3. Clear / Kosongkan Seluruh Resep Bahan Baku Menu
export async function clearMenuRecipe(menuId) {
  // Reset konfigurasi di tabel menus
  const { error: menuError } = await supabase
    .from("menus")
    .update({
      pcs_per_adonan: null,
      pcs_per_porsi: null,
    })
    .eq("id", menuId);

  if (menuError) throw menuError;

  // Hapus semua relasi di menu_bahan_baku
  const { error: deleteError } = await supabase
    .from("menu_bahan_baku")
    .delete()
    .eq("menu_id", menuId);

  if (deleteError) throw deleteError;

  return true;
}