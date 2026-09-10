import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../core/theme.dart';

class VnPayPaymentView extends StatefulWidget {
  final String paymentUrl;

  const VnPayPaymentView({super.key, required this.paymentUrl});

  @override
  State<VnPayPaymentView> createState() => _VnPayPaymentViewState();
}

class _VnPayPaymentViewState extends State<VnPayPaymentView> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.contains('vnpay-return')) {
              // Parse response code
              Uri uri = Uri.parse(request.url);
              String? responseCode = uri.queryParameters['vnp_ResponseCode'];
              
              if (responseCode == '00') {
                Navigator.pop(context, true); // Success
              } else {
                Navigator.pop(context, false); // Failed
              }
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán VNPay', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF005BAA), // VNPay blue color
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            ),
        ],
      ),
    );
  }
}
