
class Laporan {
  constructor(idLaporan, periode, totalPendapatan, topMenu) {
    this.idLaporan = idLaporan;
    this.periode = periode;
    this.totalPendapatan = totalPendapatan || 0;
    this.topMenu = topMenu || [];
  }

  generate() {
    return {
      idLaporan: this.idLaporan,
      periode: this.periode,
      totalPendapatan: this.totalPendapatan,
      topMenu: [...this.topMenu],
    };
  }
}

module.exports = Laporan;
