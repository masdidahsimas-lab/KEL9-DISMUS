
class Menu {
  constructor(idMenu, namaMenu, harga, deskripsi) {
    this.idMenu = idMenu;
    this.namaMenu = namaMenu;
    this.harga = harga;
    this.deskripsi = deskripsi;
  }

  setHarga(hargaBaru) {
    if (hargaBaru < 0) {
      throw new Error("Harga tidak boleh negatif.");
    }

    this.harga = hargaBaru;
  }

  getInfo() {
    return {
      idMenu: this.idMenu,
      namaMenu: this.namaMenu,
      harga: this.harga,
      deskripsi: this.deskripsi,
    };
  }
}

module.exports = Menu;
