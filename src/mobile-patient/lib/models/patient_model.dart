class PatientModel {
  final String id;
  final String maBenhNhan;
  final String hoTen;
  final String gioiTinh;
  final String ngaySinh;
  final String soCCCD;
  final String? maTheBHYT;
  final String? soDienThoai;
  final String? email;
  final String? diaChi;
  final String? avatarUrl;

  PatientModel({
    required this.id,
    required this.maBenhNhan,
    required this.hoTen,
    required this.gioiTinh,
    required this.ngaySinh,
    required this.soCCCD,
    this.maTheBHYT,
    this.soDienThoai = '0987654321',
    this.email,
    this.diaChi,
    this.avatarUrl,
  });

  PatientModel copyWith({
    String? hoTen,
    String? gioiTinh,
    String? ngaySinh,
    String? soCCCD,
    String? soDienThoai,
    String? email,
    String? diaChi,
    String? avatarUrl,
  }) {
    return PatientModel(
      id: id,
      maBenhNhan: maBenhNhan,
      hoTen: hoTen ?? this.hoTen,
      gioiTinh: gioiTinh ?? this.gioiTinh,
      ngaySinh: ngaySinh ?? this.ngaySinh,
      soCCCD: soCCCD ?? this.soCCCD,
      maTheBHYT: maTheBHYT,
      soDienThoai: soDienThoai ?? this.soDienThoai,
      email: email ?? this.email,
      diaChi: diaChi ?? this.diaChi,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['id'] ?? '',
      maBenhNhan: json['maBenhNhan'] ?? json['patientCode'] ?? '',
      hoTen: json['hoTen'] ?? json['fullName'] ?? '',
      gioiTinh: json['gioiTinh'] ?? 'Nam',
      ngaySinh: json['ngaySinh'] ?? '',
      soCCCD: json['soCCCD'] ?? json['identityCardNumber'] ?? '',
      maTheBHYT: json['maTheBHYT'],
      soDienThoai: json['soDienThoai'] ?? json['phoneNumber'] ?? '0987654321',
      email: json['email'] ?? '',
      diaChi: json['diaChi'] ?? json['address'] ?? 'Chưa cập nhật',
      avatarUrl: json['avatarUrl'] ?? json['photoUrl'],
    );
  }
}
