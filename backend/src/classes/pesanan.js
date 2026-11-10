
class Pesanan {
  constructor(idPesanan, tanggal, jumlah, totalHarga, status) {
    this.idPesanan = idPesanan;
    this.tanggal = tanggal || new Date();
    this.jumlah = jumlah || 0;
    this.totalHarga = totalHarga || 0;
    this.status = status || "Menunggu";
    this.daftarMenu = [];
  }

  tambahMenu(menu, jumlah) {
    if (!Number.isInteger(jumlah) || jumlah <= 0) {
      throw new Error("Jumlah menu harus bilangan bulat positif.");
    }

    this.daftarMenu.push({ menu, jumlah });
    this.jumlah += jumlah;
    this.totalHarga += menu.harga * jumlah;
  }

  hitungTotal() {
    this.totalHarga = this.daftarMenu.reduce(
      (total, item) => total + item.menu.harga * item.jumlah,
      0
    );

    return this.totalHarga;
  }

  ubahStatus(statusBaru) {
    this.status = statusBaru;
  }
}

 module.exports = Pesanan;
