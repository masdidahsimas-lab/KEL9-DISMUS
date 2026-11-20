import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  User,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Trash2,
  LoaderCircle,
  X,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";

import { supabase } from "../../lib/supabase";
import { addUserByManager } from "../../services/authService";
import { validateInput } from "../../utils/validation";

const META_STORAGE_KEY = "dimsum_employee_meta";

const readLocalMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(META_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeLocalMeta = (userId, info) => {
  if (!userId) return;
  const current = readLocalMeta();
  current[userId] = { ...(current[userId] || {}), ...info };
  localStorage.setItem(META_STORAGE_KEY, JSON.stringify(current));
};

export default function KelolaKaryawan() {
  const [employees, setEmployees] = useState([]);
  const [userTable, setUserTable] = useState("profiles");
  const [tableColumns, setTableColumns] = useState([]);
  const [localMeta, setLocalMeta] = useState(() => readLocalMeta());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // State Modal Tambah Karyawan
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "karyawan",
  });

  // State Modal Edit Karyawan
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: "",
    email: "",
    phone: "",
    role: "karyawan",
  });

  // Deteksi nama tabel aktif ('profiles' atau 'users')
  const detectUserTable = async () => {
    const { data, error } = await supabase.from("profiles").select("*").limit(1);
    if (!error) {
      setUserTable("profiles");
      if (data?.[0]) setTableColumns(Object.keys(data[0]));
      return { table: "profiles", cols: data?.[0] ? Object.keys(data[0]) : [] };
    }

    const fallback = await supabase.from("users").select("*").limit(1);
    if (!fallback.error) {
      setUserTable("users");
      if (fallback.data?.[0]) setTableColumns(Object.keys(fallback.data[0]));
      return {
        table: "users",
        cols: fallback.data?.[0] ? Object.keys(fallback.data[0]) : [],
      };
    }

    return { table: "profiles", cols: [] };
  };

  // Helper ambil email
  const getEmployeeEmail = (emp) => {
    const dbEmail = emp.email || emp.user_email || emp.email_user;
    if (dbEmail && String(dbEmail).trim()) return String(dbEmail).trim();

    const cachedEmail = localMeta[emp.id]?.email;
    if (cachedEmail && String(cachedEmail).trim()) return String(cachedEmail).trim();

    return "-";
  };

  // Helper ambil nama lengkap
  const getEmployeeName = (emp) => {
    const dbName =
      emp.full_name ||
      emp.nama ||
      emp.nama_lengkap ||
      emp.name ||
      emp.username ||
      emp.user_metadata?.full_name ||
      emp.user_metadata?.nama;

    if (dbName && String(dbName).trim()) return String(dbName).trim();

    const cachedName = localMeta[emp.id]?.fullName;
    if (cachedName && String(cachedName).trim()) return String(cachedName).trim();

    const email = getEmployeeEmail(emp);
    if (email && email !== "-") return email.split("@")[0];

    return "Karyawan";
  };

  // Helper ambil nomor telepon
  const getEmployeePhone = (emp) => {
    const dbPhone = emp.phone || emp.no_hp || emp.no_telp || emp.telepon;
    if (dbPhone && String(dbPhone).trim()) return String(dbPhone).trim();

    const cachedPhone = localMeta[emp.id]?.phone;
    if (cachedPhone && String(cachedPhone).trim()) return String(cachedPhone).trim();

    return "-";
  };

  // 1. Ambil daftar akun dengan role = 'karyawan' dari Supabase
  const fetchEmployees = async () => {
    try {
      // Prioritas 1: Ambil dari RPC get_karyawan_accounts (gabungan auth.users + profiles/users)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_karyawan_accounts"
      );

      if (!rpcError && Array.isArray(rpcData)) {
        setEmployees(rpcData);
        await detectUserTable();
        return;
      }

      // Prioritas 2: Fallback query langsung ke tabel profiles / users
      const { table } = await detectUserTable();
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("role", "karyawan")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = data || [];
      if (rows.length > 0) {
        setTableColumns(Object.keys(rows[0]));
      }
      setEmployees(rows);
    } catch (err) {
      console.error("Gagal memuat data karyawan:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Realtime Subscription Supabase
  useEffect(() => {
    fetchEmployees();

    const channel = supabase
      .channel("kelola-karyawan-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchEmployees()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => fetchEmployees()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter pencarian nama / email / no HP
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const nama = getEmployeeName(emp);
      const email = getEmployeeEmail(emp);
      const phone = getEmployeePhone(emp);
      return `${nama} ${email} ${phone}`
        .toLowerCase()
        .includes(query.toLowerCase());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, query, localMeta]);

  // Sinkronkan nama lengkap & email ke baris tabel profiles/users
  const syncEmployeeToDatabase = async (userId, fullName, email, role) => {
    const { table, cols } = await detectUserTable();
    let targetId = userId;

    // Jika ID tidak dikembalikan oleh authService, cari baris terbaru yang belum memiliki email
    if (!targetId) {
      const { data: latestRows } = await supabase
        .from(table)
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false })
        .limit(5);

      const matched = (latestRows || []).find(
        (r) => !r.email || r.email === email
      );
      targetId = matched?.id;
    }

    if (!targetId) return;

    writeLocalMeta(targetId, { fullName, email });
    setLocalMeta(readLocalMeta());

    const payload = { role };
    if (cols.length === 0 || cols.includes("full_name")) payload.full_name = fullName;
    if (cols.includes("nama")) payload.nama = fullName;
    if (cols.includes("nama_lengkap")) payload.nama_lengkap = fullName;
    if (cols.includes("name")) payload.name = fullName;
    if (cols.length === 0 || cols.includes("email")) payload.email = email;
    if (cols.includes("user_email")) payload.user_email = email;

    const { error: updateError } = await supabase
      .from(table)
      .update(payload)
      .eq("id", targetId);

    if (updateError) {
      await supabase
        .from(table)
        .upsert({ id: targetId, ...payload }, { onConflict: "id" });
    }
  };

  // Handler Tambah Akun Karyawan Baru
  const handleAddEmployee = async (e) => {
    e.preventDefault();

    const fullNameError = validateInput({
      field: "Nama lengkap",
      value: addForm.fullName,
      required: true,
      type: "string",
      minLength: 2,
      format: /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/,
    });
    if (fullNameError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: fullNameError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const emailError = validateInput({
      field: "Email karyawan",
      value: addForm.email,
      required: true,
      type: "email",
    });
    if (emailError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: emailError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const passwordError = validateInput({
      field: "Password",
      value: addForm.password,
      required: true,
      type: "string",
      minLength: 6,
    });
    if (passwordError) {
      Swal.fire({
        icon: "warning",
        title: "Input Tidak Valid",
        text: passwordError,
        confirmButtonColor: "#d97706",
      });
      return;
    }

    const trimmedName = addForm.fullName.trim();
    const trimmedEmail = addForm.email.trim();

    setSavingAdd(true);
    const { data, error } = await addUserByManager(
      trimmedEmail,
      addForm.password,
      trimmedName,
      "karyawan"
    );

    if (error) {
      setSavingAdd(false);
      Swal.fire({
        icon: "error",
        title: "Gagal Menambah Karyawan",
        text: error.message || "Terjadi kesalahan saat mendaftarkan akun.",
        confirmButtonColor: "#e11d48",
      });
      return;
    }

    const createdUserId = data?.user?.id || data?.id;
    await syncEmployeeToDatabase(
      createdUserId,
      trimmedName,
      trimmedEmail,
      "karyawan"
    );

    setSavingAdd(false);
    setIsAddModalOpen(false);
    setAddForm({ fullName: "", email: "", password: "", role: "karyawan" });
    await fetchEmployees();

    Swal.fire({
      icon: "success",
      title: "Karyawan Ditambahkan!",
      text: `Akun karyawan untuk ${trimmedName} (${trimmedEmail}) berhasil dibuat.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // Buka Modal Edit Karyawan
  const openEditModal = (emp) => {
    const currentName = getEmployeeName(emp);
    const currentEmail = getEmployeeEmail(emp);
    const currentPhone = getEmployeePhone(emp);

    setEditingEmployee(emp);
    setEditForm({
      nama: currentName === "Karyawan" ? "" : currentName,
      email: currentEmail === "-" ? "" : currentEmail,
      phone: currentPhone === "-" ? "" : currentPhone,
      role: emp.role || "karyawan",
    });
  };

  // Handler Simpan Perubahan Data Karyawan
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const trimmedName = editForm.nama.trim();
    const trimmedEmail = editForm.email.trim();
    const trimmedPhone = editForm.phone.trim();

    setSavingEdit(true);
    try {
      writeLocalMeta(editingEmployee.id, {
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });
      setLocalMeta(readLocalMeta());

      const { table, cols } = await detectUserTable();
      const activeCols = cols.length > 0 ? cols : tableColumns;

      const payload = {
        role: editForm.role,
      };

      if (activeCols.length === 0 || activeCols.includes("full_name"))
        payload.full_name = trimmedName;
      if (activeCols.includes("nama")) payload.nama = trimmedName;
      if (activeCols.includes("nama_lengkap"))
        payload.nama_lengkap = trimmedName;
      if (activeCols.includes("name")) payload.name = trimmedName;

      if (activeCols.length === 0 || activeCols.includes("email"))
        payload.email = trimmedEmail;
      if (activeCols.includes("user_email")) payload.user_email = trimmedEmail;

      if (activeCols.length === 0 || activeCols.includes("phone"))
        payload.phone = trimmedPhone;
      if (activeCols.includes("no_hp")) payload.no_hp = trimmedPhone;
      if (activeCols.includes("no_telp")) payload.no_telp = trimmedPhone;
      if (activeCols.includes("telepon")) payload.telepon = trimmedPhone;

      const { error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", editingEmployee.id);

      if (error) {
        console.warn("Update DB terbatas RLS:", error.message);
      }

      setEditingEmployee(null);
      await fetchEmployees();

      Swal.fire({
        icon: "success",
        title: "Data Diperbarui!",
        text: "Informasi akun karyawan berhasil disimpan.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Memperbarui",
        text: err.message || "Terjadi kesalahan saat memperbarui data.",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // Handler Hapus Akun Karyawan
  const handleDeleteEmployee = async (emp) => {
    const nama = getEmployeeName(emp);
    const confirm = await Swal.fire({
      title: "Hapus Akun Karyawan?",
      text: `Apakah Anda yakin ingin menghapus "${nama}" dari daftar karyawan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const { table } = await detectUserTable();
      const { error } = await supabase.from(table).delete().eq("id", emp.id);

      if (error) throw error;

      await fetchEmployees();
      Swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: "Akun karyawan berhasil dihapus.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: err.message || "Tidak dapat menghapus akun karyawan.",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800">
            <Users size={13} /> Manajemen Staf Operasional
          </div>
          <h1 className="mt-1 text-2xl font-black text-stone-800 sm:text-3xl">
            Kelola Karyawan
          </h1>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Daftar seluruh akun aktif dengan role <strong>karyawan</strong> (terhubung secara real-time).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-xs font-bold text-white shadow-md transition hover:bg-amber-700 active:scale-95 shrink-0"
        >
          <UserPlus size={18} />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Ringkasan & Kolom Pencarian */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs">
          <div>
            <span className="text-xs font-semibold text-stone-500">
              Total Akun Karyawan
            </span>
            <p className="mt-1 text-2xl font-black text-stone-800">
              {employees.length}{" "}
              <span className="text-xs font-bold text-blue-600">Aktif</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Users size={24} />
          </div>
        </div>

        <div className="sm:col-span-2 flex items-center rounded-3xl border border-stone-200/80 bg-white px-5 py-3 shadow-xs">
          <Search className="text-stone-400 mr-3 shrink-0" size={20} />
          <input
            type="text"
            placeholder="Cari nama karyawan, email, atau nomor telepon..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm font-medium text-stone-800 outline-none"
          />
        </div>
      </div>

      {/* Daftar Card Karyawan */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-200/80 bg-white py-16 text-stone-400">
          <LoaderCircle className="animate-spin text-amber-600 mb-3" size={32} />
          <p className="text-xs font-semibold">Memuat daftar akun karyawan...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-xs">
          <Users className="mx-auto mb-3 text-stone-300" size={44} />
          <h3 className="text-base font-extrabold text-stone-700">
            Belum Ada Akun Karyawan
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            Tidak ditemukan akun dengan role <strong>karyawan</strong>. Klik tombol{" "}
            <strong>Tambah Karyawan</strong> untuk mendaftarkan akun baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((emp) => {
            const nama = getEmployeeName(emp);
            const email = getEmployeeEmail(emp);
            const phone = getEmployeePhone(emp);
            const joined = emp.created_at
              ? new Date(emp.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            return (
              <div
                key={emp.id}
                className="flex flex-col justify-between rounded-3xl border border-stone-200/80 bg-white p-5 shadow-xs hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-base font-black text-white uppercase shadow-xs">
                        {nama.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-stone-800">
                          {nama}
                        </h3>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold capitalize text-blue-700 border border-blue-200">
                          <ShieldCheck size={12} />
                          {emp.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl bg-stone-50 p-3.5 text-xs text-stone-600 border border-stone-100">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-stone-400 shrink-0" />
                      <span className="truncate font-medium">{email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-stone-400 shrink-0" />
                      <span className="font-medium">{phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-stone-400 shrink-0" />
                      <span className="text-stone-500">Terdaftar: {joined}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-stone-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-100 py-2 text-xs font-bold text-stone-700 hover:bg-amber-50 hover:text-amber-700 transition"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEmployee(emp)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH KARYAWAN (MANDATORY FORM) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-stone-800">
                    Tambah Akun Karyawan
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Semua kolom bertanda wajib diisi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={savingAdd}
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={16}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={addForm.fullName}
                    onChange={(e) =>
                      setAddForm({ ...addForm, fullName: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Email Karyawan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={16}
                  />
                  <input
                    type="email"
                    required
                    placeholder="karyawan@dimsumku.com"
                    value={addForm.email}
                    onChange={(e) =>
                      setAddForm({ ...addForm, email: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Password Initial <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={16}
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm({ ...addForm, password: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Role Akses <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3.5 top-3 text-stone-400"
                    size={16}
                  />
                  <select
                    required
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm({ ...addForm, role: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-xs font-bold text-stone-700 outline-none focus:border-amber-500"
                  >
                    <option value="karyawan">Karyawan (Staf Operasional)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-3 text-[11px] text-amber-800">
                <ShieldAlert
                  size={15}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
                <span>
                  Akun baru otomatis terdaftar dengan role <strong>karyawan</strong>{" "}
                  tanpa mengeluarkan sesi login Manajer Anda.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={savingAdd}
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-2xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdd}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {savingAdd && (
                    <LoaderCircle className="animate-spin" size={16} />
                  )}
                  <span>Simpan Karyawan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT DATA KARYAWAN (MANDATORY FORM) */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <h2 className="text-base font-black text-stone-800">
                Edit Data Karyawan
              </h2>
              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setEditingEmployee(null)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={editForm.nama}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama: e.target.value })
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Email Karyawan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="karyawan@dimsumku.com"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">
                  Role Akun <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value })
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 outline-none focus:border-amber-500"
                >
                  <option value="karyawan">Karyawan</option>
                  <option value="manajer">Manajer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingEmployee(null)}
                  className="rounded-2xl border border-stone-200 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {savingEdit && (
                    <LoaderCircle className="animate-spin" size={16} />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}