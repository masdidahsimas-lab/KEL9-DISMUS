
class Pengguna {
  constructor(idPengguna, username, password, role) {
    this.idPengguna = idPengguna;
    this.username = username;
    this.password = password;
    this.role = role;
  }

  login(username, password) {
    return (
      this.username === username &&
      this.password === password
    );
  }
}

module.exports = Pengguna;
