
const Pengguna = require("./pengguna");

class Karyawan extends Pengguna {
  constructor(idPengguna, username, password, role) {
    super(idPengguna, username, password, role);
    this.daftarMenu = [];
    this.daftarPesanan = [];
    this.stokBahanBaku = [];
  }

  tambahMenu(menu) {
    this.daftarMenu.push(menu);
  }

  ubahMenu(idMenu, dataBaru) {
    const menu = this.daftarMenu.find(
      (item) => item.idMenu === idMenu
    );

    if (!menu) return false;

    Object.assign(menu, dataBaru);
    return true;
  }

  hapusMenu(idMenu) {
    const jumlahAwal = this.daftarMenu.length;

    this.daftarMenu = this.daftarMenu.filter(
      (item) => item.idMenu !== idMenu
    );

    return this.daftarMenu.length < jumlahAwal;
  }

  konfirmasiPesanan(pesanan) {
    pesanan.ubahStatus("Dikonfirmasi");
    return true;
  }

  ubahStatusPesanan(pesanan, status) {
    pesanan.ubahStatus(status);
    return true;
  }

  cetakBukti(pesanan) {
    return pesanan.hitungTotal();
  }

  kelolaStok(bahan, jumlah) {
    bahan.tambahStok(jumlah);
    return true;
  }

  validasiPembayaran(pembayaran) {
    return pembayaran.statusPembayaran === "Berhasil";
  }

  lihatStok() {
    return this.stokBahanBaku.map((bahan) => bahan.getInfo());
  }

  ubahStok(bahan, jumlah) {
    bahan.tambahStok(jumlah);
    return bahan.jumlahStok;
  }
}

module.exports = Karyawan;
// Buat objek Karyawan baru
const karyawan1 = new Karyawan("Budi", "K001");

// Tes cetak ke terminal
console.log("=== TES KARYAWAN ===");
console.log(karyawan1);