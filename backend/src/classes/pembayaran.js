
class Pembayaran {
  constructor(idPembayaran, metode, statusPembayaran, totalBayar) {
    this.idPembayaran = idPembayaran;
    this.metode = metode;
    this.statusPembayaran = statusPembayaran || "Belum dibayar";
    this.totalBayar = totalBayar || 0;
  }

  prosesPembayaran(pesanan, jumlahBayar) {
    const total = pesanan.hitungTotal();

    if (jumlahBayar < total) {
      return false;
    }

    this.totalBayar = jumlahBayar;
    this.statusPembayaran = "Berhasil";

    return true;
  }
}

module.exports = Pembayaran;
