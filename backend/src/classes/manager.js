
const Pengguna = require("./pengguna");

class Manager extends Pengguna {
  constructor(idPengguna, username, password, role) {
    super(idPengguna, username, password, role);
  }

  lihatStatistik(pesananList) {
    return {
      jumlahPesanan: pesananList.length,
      totalPendapatan: pesananList.reduce(
        (total, pesanan) =>
          total +
          (pesanan.status === "Selesai"
            ? pesanan.hitungTotal()
            : 0),
        0
      ),
    };
  }

  cetakLaporan(laporan) {
    return laporan.generate();
  }
}

module.exports = Manager;
