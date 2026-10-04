import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:webview_flutter/webview_flutter.dart';

class VnPayPaymentView extends StatefulWidget {
  final String paymentUrl;

  const VnPayPaymentView({super.key, required this.paymentUrl});

  @override
  State<VnPayPaymentView> createState() => _VnPayPaymentViewState();
}

class _VnPayPaymentViewState extends State<VnPayPaymentView> with SingleTickerProviderStateMixin {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasWebViewError = false;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('⚠️ [VNPay WebView Error]: ${error.description}');
            if (mounted) {
              setState(() {
                _isLoading = false;
                _hasWebViewError = true;
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.contains('vnpay-return') || request.url.contains('Error.html')) {
              Uri uri = Uri.parse(request.url);
              String? responseCode = uri.queryParameters['vnp_ResponseCode'];
              
              if (responseCode == '00') {
                Navigator.pop(context, true); // Success
              } else {
                Navigator.pop(context, false); // Failed or Canceled
              }
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      );

    try {
      _controller.loadRequest(Uri.parse(widget.paymentUrl));
    } catch (_) {
      _hasWebViewError = true;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Cổng Thanh Toán VNPAY',
          style: GoogleFonts.sora(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFF005BAA), // VNPay Blue
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: 'VNPAY-QR & Demo', icon: Icon(Icons.qr_code_2_rounded, size: 20)),
            Tab(text: 'Trang Web Trực Tiếp', icon: Icon(Icons.public_rounded, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildVnPayDemoInterface(),
          _buildWebViewInterface(),
        ],
      ),
    );
  }

  /// Giao diện VNPay Smart Checkout (Không bao giờ bị lỗi màn hình trắng)
  Widget _buildVnPayDemoInterface() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // VNPay Brand Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF005BAA), Color(0xFF0284C7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: const Color(0xFF005BAA).withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 6)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('VNPAY SANDBOX', style: GoogleFonts.sora(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                      child: Text('Bảo mật 256-bit', style: GoogleFonts.inter(color: Colors.white, fontSize: 11)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text('Số tiền thanh toán', style: GoogleFonts.inter(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  '150.000 đ',
                  style: GoogleFonts.sora(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                Text(
                  'Phí khám chuyên khoa • Bệnh viện D-Medical',
                  style: GoogleFonts.inter(color: Colors.white.withValues(alpha: 0.9), fontSize: 12),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // QR Code Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF005BAA), size: 22),
                    const SizedBox(width: 8),
                    Text('Quét mã VNPAY-QR để thanh toán', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Image.network(
                    'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://vnpay.vn/demo-payment-dmedical-150k',
                    width: 170,
                    height: 170,
                    errorBuilder: (_, __, ___) => Container(
                      width: 170,
                      height: 170,
                      color: Colors.grey[100],
                      child: const Icon(Icons.qr_code_2_rounded, size: 100, color: Color(0xFF005BAA)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Hỗ trợ hơn 40 ứng dụng Ngân hàng (VCB, BIDV, VietinBank, MB...) và Ví VNPAY',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(fontSize: 11.5, color: const Color(0xFF64748B)),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Action Buttons
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () {
                // Giả lập thanh toán VNPay thành công ngay lập tức
                Navigator.pop(context, true);
              },
              icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
              label: Text(
                'XÁC NHẬN THANH TOÁN THÀNH CÔNG',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981), // Emerald Green
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
            ),
          ),

          const SizedBox(height: 12),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () {
                // Trả về false để chuyển sang thanh toán tại quầy
                Navigator.pop(context, false);
              },
              icon: const Icon(Icons.storefront_rounded, color: Color(0xFF0369A1)),
              label: Text(
                'Thanh toán tại Quầy Tiếp nhận bệnh viện',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF0369A1), fontSize: 13.5),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFBAE6FD), width: 1.5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Giao diện WebView trực tiếp
  Widget _buildWebViewInterface() {
    return Stack(
      children: [
        WebViewWidget(controller: _controller),
        if (_isLoading)
          const Center(
            child: CircularProgressIndicator(color: Color(0xFF005BAA)),
          ),
        if (_hasWebViewError)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.wifi_off_rounded, size: 54, color: Colors.orange),
                  const SizedBox(height: 12),
                  Text('Cổng Sandbox VNPay bên ngoài tạm thời gián đoạn', style: GoogleFonts.sora(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  Text('Vui lòng chuyển sang tab "VNPAY-QR & Demo" để tiếp tục thanh toán.', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _tabController.animateTo(0),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF005BAA)),
                    child: const Text('Mở Tab Thanh toán Demo'),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

