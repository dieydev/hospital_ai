import 'dart:async';
import 'package:flutter/material.dart';


class QueueProvider extends ChangeNotifier {

  
  final bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _hasActiveTicket = false;
  bool get hasActiveTicket => _hasActiveTicket;

  int _currentNumber = 0;
  int get currentNumber => _currentNumber;

  int _myNumber = 0;
  int get myNumber => _myNumber;

  String _room = '';
  String get room => _room;

  String _status = '';
  String get status => _status;

  Timer? _timer;

  void startPollingQueue() {
    // For now we simulate polling
    _hasActiveTicket = true;
    _myNumber = 105;
    _currentNumber = 101;
    _room = 'Phòng 102 - Tầng 1';
    _status = 'Đang chờ tới lượt';
    notifyListeners();

    _timer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (_currentNumber < _myNumber) {
        _currentNumber++;
        if (_currentNumber == _myNumber) {
          _status = 'Đến lượt của bạn!';
        }
        notifyListeners();
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
