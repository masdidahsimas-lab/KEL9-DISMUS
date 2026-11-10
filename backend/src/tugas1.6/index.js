const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// CLASS DIAGRAM (Latihan 1.6)
// ==========================================
class NotYetSetException extends Error {
  constructor(message) {
    super(message);
    this.name = "NotYetSetException";
  }
}

class Student {
  #name;
  constructor(name = "") {
    this.#name = name;
  }
  getName() { return this.#name; }
  setName(n) { this.#name = n; }
}

class Assignment {
  #mark = -1;
  getMark() {
    if (this.#mark === -1) {
      throw new NotYetSetException("Mark is not yet set");
    }
    return this.#mark;
  }
  setMark(m) { this.#mark = m; }
}

class CourseRecord {
  #student;
  #assignments = [];
  getStudent() { return this.#student; }
  setStudent(s) { this.#student = s; }
  addAssignment(a) { this.#assignments.push(a); }
  getAssignments() { return this.#assignments; }
}

class Course {
  #title;
  #courseRecords = [];

  getTitle() { return this.#title; }
  setTitle(t) { this.#title = t; }
  addCourseRecord(cr) { this.#courseRecords.push(cr); }
  getCourseRecords() { return this.#courseRecords; }

  // Method 1: Ambil daftar nama mahasiswa
  getCourseStudents() {
    return this.#courseRecords
      .map((cr) => cr.getStudent() ? cr.getStudent().getName() : null)
      .filter(Boolean);
  }

  // Method 2: Best Student (logika latihan)
  getBestStudent() {
    /* TODO: Lengkapi logika pencarian nilai terbaik */
    return "Logika best student belum diisi";
  }

  // Method 3: Final Exam Students (logika latihan)
  getFinalExamStudents() {
    /* TODO: Lengkapi logika kelayakan ujian akhir */
    return "Logika final exam belum diisi";
  }
}

// Inisialisasi Objek Course Utama
const course = new Course();
course.setTitle("Implementasi Sistem Informasi");

// ==========================================
// EXPRESS ROUTING / API ENDPOINTS
// ==========================================

// Endpoint 1: Tampilkan daftar mahasiswa di course
app.get('/students', (req, res) => {
  res.json({
    course: course.getTitle(),
    students: course.getCourseStudents()
  });
});

// Endpoint 2: Tambah mahasiswa baru via Request Body (JSON)
app.post('/students', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Nama mahasiswa wajib diisi!" });
  }

  const newStudent = new Student(name);
  const newRecord = new CourseRecord();
  newRecord.setStudent(newStudent);
  course.addCourseRecord(newRecord);

  res.json({
    message: "Mahasiswa berhasil ditambahkan",
    student: name
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server Express jalan di http://localhost:${PORT}`);
});