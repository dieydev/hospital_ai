class PatientModel {
  final String id;
  final String maBenhNhan;
  final String hoTen;
  final String gioiTinh;
  final String ngaySinh;
  final String soCCCD;
  final String? maTheBHYT;
  final String? soDienThoai;
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
    this.avatarUrl,
  });

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['id'] ?? '',
      maBenhNhan: json['maBenhNhan'] ?? '',
      hoTen: json['hoTen'] ?? '',
      gioiTinh: json['gioiTinh'] ?? 'Other',
      ngaySinh: json['ngaySinh'] ?? '',
      soCCCD: json['soCCCD'] ?? '',
      maTheBHYT: json['maTheBHYT'],
      soDienThoai: json['soDienThoai'] ?? json['phoneNumber'] ?? '0987654321',
      avatarUrl: json['avatarUrl'] ?? json['photoUrl'],
    );
  }
}
