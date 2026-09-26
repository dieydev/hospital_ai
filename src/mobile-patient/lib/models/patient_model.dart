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
  final bool isProfileComplete;

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
    this.isProfileComplete = false,
  });

  /// Kiểm tra xem hồ sơ bệnh nhân đã được hoàn thiện đầy đủ hay chưa
  bool get isComplete {
    if (!isProfileComplete) return false;
    final validName = hoTen.trim().isNotEmpty && hoTen.trim() != 'Bệnh nhân mới';
    final validCCCD = soCCCD.trim().length >= 9;
    final validDob = ngaySinh.trim().isNotEmpty;
    final validAddress = diaChi != null && diaChi!.trim().isNotEmpty && diaChi!.trim() != 'Chưa cập nhật';
    return validName && validCCCD && validDob && validAddress;
  }

  PatientModel copyWith({
    String? id,
    String? maBenhNhan,
    String? hoTen,
    String? gioiTinh,
    String? ngaySinh,
    String? soCCCD,
    String? maTheBHYT,
    String? soDienThoai,
    String? email,
    String? diaChi,
    String? avatarUrl,
    bool? isProfileComplete,
  }) {
    return PatientModel(
      id: id ?? this.id,
      maBenhNhan: maBenhNhan ?? this.maBenhNhan,
      hoTen: hoTen ?? this.hoTen,
      gioiTinh: gioiTinh ?? this.gioiTinh,
      ngaySinh: ngaySinh ?? this.ngaySinh,
      soCCCD: soCCCD ?? this.soCCCD,
      maTheBHYT: maTheBHYT ?? this.maTheBHYT,
      soDienThoai: soDienThoai ?? this.soDienThoai,
      email: email ?? this.email,
      diaChi: diaChi ?? this.diaChi,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isProfileComplete: isProfileComplete ?? this.isProfileComplete,
    );
  }

  factory PatientModel.fromJson(Map<String, dynamic> json) {
    final rawFullName = json['hoTen'] ?? json['fullName'] ?? '';
    final rawCCCD = json['soCCCD'] ?? json['identityCardNumber'] ?? '';
    final rawAddress = json['diaChi'] ?? json['address'] ?? '';
    final rawDob = json['ngaySinh'] ?? json['dateOfBirth']?.toString() ?? '';
    
    // Explicit server flag or inferred from valid non-placeholder data
    final bool hasExplicitFlag = json['isProfileComplete'] == true;
    final bool hasValidData = rawFullName.toString().trim().isNotEmpty &&
        rawFullName.toString().trim() != 'Bệnh nhân mới' &&
        rawCCCD.toString().trim().length >= 9 &&
        rawAddress.toString().trim().isNotEmpty &&
        rawAddress.toString().trim() != 'Chưa cập nhật';

    return PatientModel(
      id: json['id']?.toString() ?? '',
      maBenhNhan: json['maBenhNhan'] ?? json['patientCode'] ?? '',
      hoTen: rawFullName,
      gioiTinh: json['gioiTinh'] ?? json['gender'] ?? 'Nam',
      ngaySinh: rawDob,
      soCCCD: rawCCCD,
      maTheBHYT: json['maTheBHYT'] ?? json['healthInsuranceNumber'],
      soDienThoai: json['soDienThoai'] ?? json['phoneNumber'] ?? '',
      email: json['email'] ?? '',
      diaChi: rawAddress.isEmpty ? 'Chưa cập nhật' : rawAddress,
      avatarUrl: json['avatarUrl'] ?? json['photoUrl'],
      isProfileComplete: hasExplicitFlag || hasValidData,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientCode': maBenhNhan,
      'fullName': hoTen,
      'gender': gioiTinh,
      'dateOfBirth': ngaySinh,
      'identityCardNumber': soCCCD,
      'healthInsuranceNumber': maTheBHYT,
      'phoneNumber': soDienThoai,
      'email': email,
      'address': diaChi,
      'photoUrl': avatarUrl,
      'isProfileComplete': isProfileComplete,
    };
  }
}
