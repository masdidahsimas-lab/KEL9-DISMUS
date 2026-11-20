import { supabase } from "../lib/supabase";

const TABLE_NAME = "pesanan";
const ORDER_STATUS = {
  COMPLETED: "Selesai",
};
const MAX_DATE_NUMBER = 99999999;

/**
 * Mengubah berbagai format tanggal menjadi angka integer YYYYMMDD.
 * Memperbaiki masalah duplikasi dan kompleksitas logika fallback.
 */
function parseDateToInteger(rawValue) {
  if (!rawValue) return 0;
  
  let dateObj = new Date(rawValue);

  // Fallback 1: Penanganan Unix Timestamp
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date(Number(rawValue));
  }
  
  // Fallback 2: Penanganan format DD/MM/YYYY atau DD-MM-YYYY
  if (isNaN(dateObj.getTime()) && typeof rawValue === "string") {
    const parts = rawValue.split(/[-/]/);
    if (parts.length === 3 && parts[2].length === 4) {
      dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
  }
  
  if (isNaN(dateObj.getTime())) return 0;
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();

  return (year * 10000) + (month * 100) + day;
}

/**
 * Mengubah input tanggal standar browser (YYYY-MM-DD) menjadi integer.
 */
function parseInputToInteger(dateString) {
  if (!dateString) return 0;
  
  if (dateString.includes("-") && dateString.split("-")[0].length === 4) {
    return Number(dateString.replace(/-/g, ""));
  }
  
  return parseDateToInteger(dateString); // Menggunakan ulang fungsi di atas untuk mencegah duplikasi
}

const calculateRevenue = (orders) => 
  orders.reduce((total, order) => total + Number(order.total_harga || 0), 0);

export async function getReportData(startDate = null, endDate = null) {
  const { data: rawOrders = [], error } = await supabase
    .from(TABLE_NAME)
    .select("id, kode_pesanan, tanggal_pesanan, created_at, total_harga, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data laporan:", error);
    throw error;
  }

  const startLimit = startDate ? parseInputToInteger(startDate) : 0;
  const endLimit = endDate ? parseInputToInteger(endDate) : MAX_DATE_NUMBER;

  // Formatting filter yang lebih ringkas dan modular
  const isDateFiltered = startLimit > 0 || endLimit < MAX_DATE_NUMBER;
  
  const filteredOrders = isDateFiltered
    ? rawOrders.filter((order) => {
        const orderDateNum = parseDateToInteger(order.tanggal_pesanan || order.created_at);
        return orderDateNum > 0 && orderDateNum >= startLimit && orderDateNum <= endLimit;
      })
    : rawOrders;

  const completedOrders = filteredOrders.filter(
    (order) => order.status === ORDER_STATUS.COMPLETED
  );

  return {
    orders: filteredOrders,
    totalOrders: filteredOrders.length,
    completedCount: completedOrders.length,
    revenue: calculateRevenue(completedOrders),
  };
}