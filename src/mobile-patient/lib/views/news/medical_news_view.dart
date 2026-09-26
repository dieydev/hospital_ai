import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme.dart';

class MedicalNewsView extends StatefulWidget {
  const MedicalNewsView({super.key});

  @override
  State<MedicalNewsView> createState() => _MedicalNewsViewState();
}

class _MedicalNewsViewState extends State<MedicalNewsView> {
  String _selectedCategory = 'Tất cả';
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<String> _categories = [
    'Tất cả',
    'Công nghệ Y tế',
    'Sức khỏe Cộng đồng',
    'Thông báo',
    'Dinh dưỡng',
    'Phòng bệnh',
  ];

  final List<Map<String, String>> _articles = [
    {
      'title': 'Bệnh viện D-Medical ứng dụng AI trong chẩn đoán hình ảnh X-Quang, CT & MRI',
      'desc': 'Hệ thống D-Medical AI giúp tăng 98% độ chính xác trong tầm soát bệnh lý tim mạch & ung thư nội soi tiêu hóa sớm.',
      'date': '14 Tháng 9, 2026',
      'image': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
      'tag': 'Công nghệ Y tế',
      'readTime': '5 phút đọc',
    },
    {
      'title': 'Cảnh báo dịch Sốt xuất huyết mùa mưa: Phòng ngừa đúng cách cho trẻ em',
      'desc': 'Bộ Y tế cảnh báo ca sốt xuất huyết tăng mạnh tại TP.HCM, hướng dẫn nhận biết triệu chứng và phòng tránh.',
      'date': '12 Tháng 9, 2026',
      'image': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
      'tag': 'Phòng bệnh',
      'readTime': '4 phút đọc',
    },
    {
      'title': 'Khuyến cáo sức khỏe mùa nắng nóng: Phòng tránh đột quỵ & say nắng',
      'desc': 'Các chuyên gia y tế D-Medical hướng dẫn cách duy trì thể trạng tốt cho người cao tuổi & trẻ nhỏ trong mùa hè.',
      'date': '10 Tháng 9, 2026',
      'image': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=500&auto=format&fit=crop&q=80',
      'tag': 'Sức khỏe Cộng đồng',
      'readTime': '6 phút đọc',
    },
    {
      'title': 'Thông báo Lịch làm việc & Khám ngoài giờ Thứ 7, Chủ Nhật từ tháng 10',
      'desc': 'Bệnh viện mở rộng khung giờ tiếp nhận khám BHYT từ 07:00 đến 20:00 hằng ngày. Không cần đặt lịch trước cho khám ngoài giờ.',
      'date': '08 Tháng 9, 2026',
      'image': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&auto=format&fit=crop&q=80',
      'tag': 'Thông báo',
      'readTime': '3 phút đọc',
    },
    {
      'title': 'Chế độ dinh dưỡng vàng cho bệnh nhân Tiểu đường Type 2 theo khuyến cáo mới',
      'desc': 'Chuyên gia Nội tiết - Đái tháo đường D-Medical cập nhật hướng dẫn ăn uống tối ưu kiểm soát đường huyết 2026.',
      'date': '05 Tháng 9, 2026',
      'image': 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&auto=format&fit=crop&q=80',
      'tag': 'Dinh dưỡng',
      'readTime': '8 phút đọc',
    },
    {
      'title': 'Vắc xin Cúm mùa 2026-2027: Ai cần tiêm và thời điểm nào tốt nhất?',
      'desc': 'Khoa Tiêm chủng D-Medical đã nhập về vắc xin cúm quadrivalent thế hệ mới, ưu tiên cho trẻ <5 tuổi và người >65 tuổi.',
      'date': '02 Tháng 9, 2026',
      'image': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&auto=format&fit=crop&q=80',
      'tag': 'Phòng bệnh',
      'readTime': '5 phút đọc',
    },
  ];

  List<Map<String, String>> get _filteredArticles {
    return _articles.where((article) {
      final matchCategory = _selectedCategory == 'Tất cả' || article['tag'] == _selectedCategory;
      final matchSearch = _searchQuery.isEmpty ||
          article['title']!.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          article['desc']!.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F8FA),
      body: Column(
        children: [
          // App Bar
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0369A1), Color(0xFF0284C7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                          padding: EdgeInsets.zero,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Tin Tức & Sức Khỏe',
                            style: GoogleFonts.sora(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Search Bar
                    TextField(
                      controller: _searchController,
                      onChanged: (v) => setState(() => _searchQuery = v),
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        hintText: 'Tìm kiếm bài viết...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF0284C7), size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                                icon: const Icon(Icons.clear_rounded, color: Color(0xFF94A3B8), size: 18),
                              )
                            : null,
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Category Filter
          SizedBox(
            height: 52,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              itemCount: _categories.length,
              itemBuilder: (ctx, i) {
                final cat = _categories[i];
                final isActive = _selectedCategory == cat;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = cat),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: isActive ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isActive ? AppTheme.primary : const Color(0xFFE2E8F0),
                      ),
                      boxShadow: isActive
                          ? [BoxShadow(color: AppTheme.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
                          : [],
                    ),
                    child: Text(
                      cat,
                      style: GoogleFonts.inter(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                        color: isActive ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Articles Grid
          Expanded(
            child: _filteredArticles.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.article_outlined, size: 64, color: Colors.grey[300]),
                        const SizedBox(height: 12),
                        Text(
                          'Không tìm thấy bài viết',
                          style: GoogleFonts.sora(fontSize: 16, color: const Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                    itemCount: _filteredArticles.length,
                    itemBuilder: (context, index) {
                      final item = _filteredArticles[index];
                      return _buildArticleCard(context, item, index == 0);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildArticleCard(BuildContext context, Map<String, String> item, bool isFeatured) {
    if (isFeatured) {
      return GestureDetector(
        onTap: () => _showArticleDetail(context, item),
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: Image.network(
                      item['image']!,
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        height: 180,
                        color: const Color(0xFFE0F2FE),
                        child: const Center(child: Icon(Icons.image_outlined, color: AppTheme.primary, size: 48)),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 14,
                    left: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryDark.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, color: Colors.amber, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            'NỔI BẬT',
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 14,
                    right: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        item['tag']!,
                        style: GoogleFonts.inter(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['title']!,
                      style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A), height: 1.3),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item['desc']!,
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), height: 1.45),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_rounded, size: 13, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Text(item['date']!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                        const SizedBox(width: 14),
                        const Icon(Icons.access_time_rounded, size: 13, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Text(item['readTime']!, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                        const Spacer(),
                        Text(
                          'Đọc ngay →',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: () => _showArticleDetail(context, item),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                item['image']!,
                width: 90,
                height: 72,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 90,
                  height: 72,
                  color: const Color(0xFFE0F2FE),
                  child: const Icon(Icons.image_outlined, color: AppTheme.primary),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      item['tag']!,
                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    item['title']!,
                    style: GoogleFonts.sora(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A), height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Text(
                    item['date']!,
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 20),
          ],
        ),
      ),
    );
  }

  void _showArticleDetail(BuildContext context, Map<String, String> item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => _ArticleDetailView(article: item),
      ),
    );
  }
}

class _ArticleDetailView extends StatelessWidget {
  final Map<String, String> article;
  const _ArticleDetailView({required this.article});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            backgroundColor: AppTheme.primaryDark,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    article['image']!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(color: const Color(0xFF0284C7)),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.transparent, Colors.black.withValues(alpha: 0.5)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      article['tag']!,
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    article['title']!,
                    style: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A), height: 1.3),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, size: 14, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 5),
                      Text(article['date']!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                      const SizedBox(width: 16),
                      const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 5),
                      Text(article['readTime']!, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: Divider(color: Color(0xFFE2E8F0)),
                  ),
                  Text(
                    article['desc']!,
                    style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF334155), height: 1.7),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Nội dung chi tiết sẽ được cập nhật từ hệ thống CMS của bệnh viện. Vui lòng liên hệ bộ phận Truyền thông để biết thêm thông tin.',
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B), height: 1.6, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 30),
                  // Share / Save actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.bookmark_border_rounded, size: 18),
                          label: const Text('Lưu bài'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: const BorderSide(color: Color(0xFFBAE6FD)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.share_rounded, size: 18),
                          label: const Text('Chia sẻ'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
