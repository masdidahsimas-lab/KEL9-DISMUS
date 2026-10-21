
class StokBahanBaku {
  constructor(idBahan, namaBahan, jumlahStok, jumlahMinimum) {
    this.idBahan = idBahan;
    this.namaBahan = namaBahan;
    this.jumlahStok = jumlahStok || 0;
    this.jumlahMinimum = jumlahMinimum || 0;
  }

  tambahStok(jumlah) {
    if (jumlah <= 0) {
      throw new Error("Jumlah harus lebih dari 0.");
    }

    this.jumlahStok += jumlah;
  }

  kurangiStok(jumlah) {
    if (jumlah <= 0 || jumlah > this.jumlahStok) {
      throw new Error("Stok tidak mencukupi.");
    }

    this.jumlahStok -= jumlah;
  }
}

 module.exports = StokBahanBaku;
