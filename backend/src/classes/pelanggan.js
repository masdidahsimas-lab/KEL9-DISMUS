
const Pengguna = require("./pengguna");

class Pelanggan extends Pengguna {
  constructor(idPengguna, username, password, role) {
    super(idPengguna, username, password, role);
    this.daftarPesanan = [];
  }

  lihatMenu(daftarMenu) {
    return daftarMenu.map((menu) => menu.getInfo());
  }

  buatPesanan(pesanan) {
    this.daftarPesanan.push(pesanan);
    return pesanan;
  }

  batalkanPesanan(pesanan) {
    if (
      pesanan.status === "Selesai" ||
      pesanan.status === "Dibatalkan"
    ) {
      return false;
    }

    pesanan.ubahStatus("Dibatalkan");
    return true;
  }

  bayarPesanan(pembayaran, jumlahBayar) {
    return pembayaran.prosesPembayaran(jumlahBayar);
  }
}

module.exports = Pelanggan;
