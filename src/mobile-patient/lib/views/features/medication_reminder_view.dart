import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MedicationReminderView extends StatefulWidget {
  const MedicationReminderView({super.key});

  @override
  State<MedicationReminderView> createState() => _MedicationReminderViewState();
}

class _MedicationReminderViewState extends State<MedicationReminderView> {
  int _selectedDayIndex = 2; // Hôm nay

  final List<Map<String, dynamic>> _days = [
    {'day': 'T.Hai', 'date': '24/09'},
    {'day': 'T.Ba', 'date': '25/09'},
    {'day': 'Hôm nay', 'date': '26/09'},
    {'day': 'T.Năm', 'date': '27/09'},
    {'day': 'T.Sáu', 'date': '28/09'},
    {'day': 'T.Bảy', 'date': '29/09'},
    {'day': 'C.Nhật', 'date': '30/09'},
  ];

  final List<Map<String, dynamic>> _medications = [
    {
      'id': 'med_1',
      'name': 'Augmentin (Amoxicillin/Clavulanate)',
      'dosage': '625mg • 1 viên',
      'instruction': 'Uống sau bữa ăn no 15 phút',
      'session': 'Sáng',
      'time': '07:30',
      'isTaken': true,
      'takenAt': '07:35',
      'doctor': 'BS. CKII Lê Văn C',
    },
    {
      'id': 'med_2',
      'name': 'Paracetamol Panadol Extra',
      'dosage': '500mg • 1 viên',
      'instruction': 'Uống khi còn sốt hoặc đau đầu',
      'session': 'Sáng',
      'time': '07:30',
      'isTaken': true,
      'takenAt': '07:35',
      'doctor': 'BS. CKII Lê Văn C',
    },
    {
      'id': 'med_3',
      'name': 'Enervon-C (Bổ sung Vitamin C & B)',
      'dosage': '500mg • 1 viên',
      'instruction': 'Uống ngay sau bữa ăn trưa',
      'session': 'Trưa',
      'time': '12:30',
      'isTaken': true,
      'takenAt': '12:45',
      'doctor': 'BS. CKII Lê Văn C',
    },
    {
      'id': 'med_4',
      'name': 'Augmentin (Amoxicillin/Clavulanate)',
      'dosage': '625mg • 1 viên',
      'instruction': 'Uống sau bữa ăn tối',
      'session': 'Tối',
      'time': '19:30',
      'isTaken': false,
      'takenAt': null,
      'doctor': 'BS. CKII Lê Văn C',
    },
    {
      'id': 'med_5',
      'name': 'Omeprazole',
      'dosage': '20mg • 1 viên',
      'instruction': 'Uống trước khi đi ngủ 30 phút với nước ấm',
      'session': 'Tối',
      'time': '21:30',
      'isTaken': false,
      'takenAt': null,
      'doctor': 'BS. CKII Lê Văn C',
    },
  ];

  void _toggleMedication(String id) {
    setState(() {
      final index = _medications.indexWhere((m) => m['id'] == id);
      if (index != -1) {
        final current = _medications[index]['isTaken'] as bool;
        _medications[index]['isTaken'] = !current;
        if (!current) {
          final now = TimeOfDay.now();
          final formattedHour = now.hour.toString().padLeft(2, '0');
          final formattedMinute = now.minute.toString().padLeft(2, '0');
          _medications[index]['takenAt'] = '$formattedHour:$formattedMinute';
        } else {
          _medications[index]['takenAt'] = null;
        }
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Đã cập nhật trạng thái uống thuốc'),
        duration: Duration(milliseconds: 1200),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showAddMedicationDialog() {
    final nameCtrl = TextEditingController();
    final dosageCtrl = TextEditingController(text: '1 viên');
    final instructionCtrl = TextEditingController(text: 'Uống sau khi ăn no');
    String selectedSession = 'Sáng';
    String selectedTime = '07:30';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 28,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.add_alarm_rounded, color: Color(0xFF0284C7), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Thêm Lịch Nhắc Uống Thuốc',
                    style: GoogleFonts.sora(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Tên thuốc
              Text('Tên thuốc', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF334155))),
              const SizedBox(height: 6),
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  hintText: 'VD: Kháng sinh, Vitamin C, Hạ áp...',
                  hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),
              const SizedBox(height: 14),

              // Liều lượng & Buổi
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Liều dùng', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF334155))),
                        const SizedBox(height: 6),
                        TextField(
                          controller: dosageCtrl,
                          decoration: InputDecoration(
                            hintText: 'VD: 1 viên, 5ml',
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Khung giờ', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF334155))),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: selectedSession,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'Sáng', child: Text('Sáng (07:30)')),
                            DropdownMenuItem(value: 'Trưa', child: Text('Trưa (12:30)')),
                            DropdownMenuItem(value: 'Chiều', child: Text('Chiều (17:30)')),
                            DropdownMenuItem(value: 'Tối', child: Text('Tối (20:00)')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setModalState(() {
                                selectedSession = val;
                                if (val == 'Sáng') selectedTime = '07:30';
                                if (val == 'Trưa') selectedTime = '12:30';
                                if (val == 'Chiều') selectedTime = '17:30';
                                if (val == 'Tối') selectedTime = '20:00';
                              });
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Hướng dẫn
              Text('Lời dặn / Hướng dẫn uống', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13, color: const Color(0xFF334155))),
              const SizedBox(height: 6),
              TextField(
                controller: instructionCtrl,
                decoration: InputDecoration(
                  hintText: 'VD: Sau ăn no 15 phút, uống nhiều nước...',
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFBAE6FD))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),
              const SizedBox(height: 22),

              // Button Lưu
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    final name = nameCtrl.text.trim();
                    if (name.isEmpty) return;

                    setState(() {
                      _medications.add({
                        'id': 'med_${DateTime.now().millisecondsSinceEpoch}',
                        'name': name,
                        'dosage': dosageCtrl.text.trim(),
                        'instruction': instructionCtrl.text.trim(),
                        'session': selectedSession,
                        'time': selectedTime,
                        'isTaken': false,
                        'takenAt': null,
                        'doctor': 'Bệnh nhân tự tạo',
                      });
                    });

                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Đã tạo lịch nhắc uống "$name" thành công!'),
                        backgroundColor: const Color(0xFF0284C7),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text('Lưu Nhắc Nhở', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _syncFromEMR() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
            SizedBox(width: 10),
            Expanded(child: Text('Đã đồng bộ 5 loại thuốc từ Toa khám mới nhất của BS. Lê Văn C!')),
          ],
        ),
        backgroundColor: Color(0xFF0369A1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final int takenCount = _medications.where((m) => m['isTaken'] == true).length;
    final int totalCount = _medications.length;
    final double adherenceRate = totalCount > 0 ? (takenCount / totalCount) : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF0F9FF),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFE0F2FE),
              Color(0xFFF0F9FF),
              Color(0xFFE2E8F0),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Custom Header Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
                      tooltip: 'Quay lại',
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Nhắc Lịch Uống Thuốc',
                            style: GoogleFonts.sora(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Tuân thủ đơn thuốc y khoa D-Medical',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: _showAddMedicationDialog,
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF0284C7),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: const BorderSide(color: Color(0xFFBAE6FD)),
                        ),
                      ),
                      icon: const Icon(Icons.add_rounded, size: 22),
                      tooltip: 'Thêm nhắc nhở',
                    ),
                  ],
                ),
              ),

              // Content Body
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. Tiến độ uống thuốc hôm nay (Hero Card)
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFBAE6FD)),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x150284C7),
                              blurRadius: 20,
                              offset: Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE0F2FE),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(Icons.medication_rounded, color: Color(0xFF0284C7), size: 26),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Tiến Độ Hôm Nay',
                                        style: GoogleFonts.sora(
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                      Text(
                                        '$takenCount / $totalCount liều đã hoàn thành',
                                        style: GoogleFonts.inter(
                                          fontSize: 12.5,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: adherenceRate >= 0.6
                                        ? const Color(0xFFD1FAE5)
                                        : const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    '${(adherenceRate * 100).toInt()}% Tuân thủ',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: adherenceRate >= 0.6
                                          ? const Color(0xFF059669)
                                          : const Color(0xFFD97706),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: adherenceRate,
                                minHeight: 8,
                                backgroundColor: const Color(0xFFE2E8F0),
                                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0284C7)),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Cập nhật tự động từ Hồ sơ Bệnh án EMR',
                                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                ),
                                InkWell(
                                  onTap: _syncFromEMR,
                                  borderRadius: BorderRadius.circular(6),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.sync_rounded, size: 14, color: Color(0xFF0284C7)),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Đồng bộ lại',
                                          style: GoogleFonts.inter(
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.bold,
                                            color: const Color(0xFF0284C7),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // 2. Dải chọn ngày trong tuần
                      SizedBox(
                        height: 72,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _days.length,
                          itemBuilder: (context, index) {
                            final item = _days[index];
                            final isSelected = index == _selectedDayIndex;

                            return GestureDetector(
                              onTap: () => setState(() => _selectedDayIndex = index),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 64,
                                margin: const EdgeInsets.only(right: 10),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF0284C7) : Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFBAE6FD),
                                  ),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: const Color(0xFF0284C7).withValues(alpha: 0.3),
                                            blurRadius: 10,
                                            offset: const Offset(0, 4),
                                          ),
                                        ]
                                      : [],
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      item['day'],
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      item['date'],
                                      style: GoogleFonts.sora(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 22),

                      // 3. Danh sách các buổi uống thuốc
                      _buildSessionSection('Buổi Sáng', '07:00 - 08:30', Icons.wb_sunny_rounded, const Color(0xFFF59E0B)),
                      const SizedBox(height: 16),
                      _buildSessionSection('Buổi Trưa', '12:00 - 13:00', Icons.wb_twilight_rounded, const Color(0xFF0284C7)),
                      const SizedBox(height: 16),
                      _buildSessionSection('Buổi Tối & Trước ngủ', '19:00 - 21:30', Icons.nightlight_round, const Color(0xFF6366F1)),
                      const SizedBox(height: 24),

                      // 4. Lịch hẹn tái khám gắn liền với đơn thuốc
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.event_repeat_rounded, color: Color(0xFF16A34A), size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Lịch Hẹn Tái Khám',
                                    style: GoogleFonts.sora(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF166534),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '08:30 • Thứ Hai, 05/10/2026\nKhoa Nội Tổng Hợp - BS. Lê Văn C',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: const Color(0xFF15803D),
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 36),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSessionSection(String sessionTitle, String timeRange, IconData icon, Color iconColor) {
    final list = _medications.where((m) {
      if (sessionTitle.contains('Sáng')) return m['session'] == 'Sáng';
      if (sessionTitle.contains('Trưa')) return m['session'] == 'Trưa';
      return m['session'] == 'Tối' || m['session'] == 'Chiều';
    }).toList();

    if (list.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: iconColor),
            const SizedBox(width: 8),
            Text(
              sessionTitle,
              style: GoogleFonts.sora(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '($timeRange)',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: const Color(0xFF64748B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Column(
          children: list.map((med) => _buildMedicationCard(med)).toList(),
        ),
      ],
    );
  }

  Widget _buildMedicationCard(Map<String, dynamic> med) {
    final bool isTaken = med['isTaken'] as bool;
    final String id = med['id'] as String;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isTaken ? const Color(0xFFBBF7D0) : const Color(0xFFBAE6FD),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0284C7),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Checkbox / Status
          GestureDetector(
            onTap: () => _toggleMedication(id),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isTaken ? const Color(0xFF10B981) : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isTaken ? const Color(0xFF10B981) : const Color(0xFFCBD5E1),
                  width: 1.5,
                ),
              ),
              child: isTaken
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 20)
                  : null,
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        med['name'],
                        style: GoogleFonts.sora(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isTaken ? const Color(0xFF64748B) : const Color(0xFF0F172A),
                          decoration: isTaken ? TextDecoration.lineThrough : null,
                        ),
                      ),
                    ),
                    Text(
                      med['time'],
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0284C7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  med['dosage'],
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0369A1),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  med['instruction'],
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF475569),
                  ),
                ),
                if (isTaken && med['takenAt'] != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.done_all_rounded, size: 14, color: Color(0xFF10B981)),
                      const SizedBox(width: 4),
                      Text(
                        'Đã uống lúc ${med['takenAt']}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
