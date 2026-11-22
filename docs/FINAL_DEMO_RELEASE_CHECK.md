# BÁO CÁO NGHIỆM THU CUỐI CÙNG TRƯỚC KHI CHỐT DEMO
**Dự án:** Hospital AI – Hệ Thống Y Tế Số Thông Minh  
**Phiên bản:** v2.6.2-FINAL (Release Candidate)  
**Nhánh Git:** `audit/post-second-audit-hardening`  
**Ngày kiểm chứng:** 22/11/2026  
**Môi trường kiểm thử:** Host Windows (x64), .NET 9.0 SDK, SQL Server (`LAPTOP-QG1C3DNG\SQLEXPRESS`)

---

## 1. Xác Nhận Lỗi Kỹ Thuật & Nghiệp Vụ Đã Khắc Phục

### 1.1. Lỗi `sp_getapplock` trong EF Core & Khóa Quota (Nhiệm vụ A)
* **Hiện tượng lỗi được xác nhận:** Khi chạy `_dbContext.Database.SqlQueryRaw<int>("DECLARE @ret INT; EXEC @ret = sp_getapplock ...; SELECT @ret AS Value;")`, EF Core tự động bọc câu lệnh vào khối truy vấn phụ (`SELECT TOP(1) FROM (...)`). SQL Server từ chối cú pháp `DECLARE/EXEC` bên trong subquery, dẫn đến ngoại lệ:
  ```text
  InvalidOperationException: 'FromSql' or 'SqlQuery' was called with non-composable SQL and with a query composing over it.
  ```
* **Lỗ hổng nuốt ngoại lệ:** Khối `catch (Exception appLockEx) when (!appLockEx.Message.Contains("sp_getapplock"))` trước đây đã bắt ngoại lệ này (vì thông điệp lỗi của EF Core không chứa chuỗi `sp_getapplock`), in ra console warning và **tiếp tục tạo lịch hẹn mà không hề có khóa Quota phân tán**.
* **Giải pháp khắc phục triệt để:**
  1. Chuyển đổi cơ chế gọi `sp_getapplock` sang **ADO.NET `DbCommand` trực tiếp lồng trong Transaction hiện tại của EF Core** (`cmd.Transaction = _dbContext.Database.CurrentTransaction?.GetDbTransaction(); cmd.CommandType = CommandType.StoredProcedure`).
  2. Bắt giá trị trả về `@ReturnValue`: Nếu `retCode < 0` (lỗi khóa, timeout -1, hủy -2, hoặc deadlock -3), lập tức `await slotTx.RollbackAsync()` và phản hồi HTTP 409 Conflict.
  3. Bổ sung bắt riêng ngoại lệ `SqlException` với mã lỗi `1205` (Deadlock victim) để rollback an toàn.
  4. Nếu có bất kỳ ngoại lệ nào phát sinh khi lấy khóa, hệ thống **bắt buộc rollback và trả về lỗi, tuyệt đối không được tiếp tục tạo lịch hẹn**.

### 1.2. Kiểm Soát Thứ Tự Ưu Tiên & Xác Nhận Cấp Cứu Chuyên Môn (Nhiệm vụ B)
* **Hiện tượng lỗi được xác nhận:** `QueueService` trước đây tin cậy trực tiếp trường `dto.Priority` và `dto.PriorityReason` do Client gửi lên. Nếu client gửi `Priority = "Emergency"`, hệ thống tự động gán cấp cứu mà không kiểm tra thẩm quyền.
* **Giải pháp khắc phục triệt để:**
  1. **Không tin trực tiếp client:** Mặc định `Priority` luôn khởi tạo là `"Normal"`.
  2. **Điều kiện kích hoạt cấp cứu (`Emergency`):** Chỉ được phép khi có đầy đủ xác nhận từ nhân sự y tế chuyên môn (`IsEmergencyConfirmed = true`, `EmergencyConfirmedBy`, `EmergencyConfirmedAt`, `EmergencyReason`). Nếu client tự gửi `Priority = "Emergency"` mà thiếu xác nhận hợp lệ, hệ thống từ chối quyền khẩn cấp và đưa về `"Normal"`.
  3. **Đối tượng ưu tiên luật định:** Tự động đánh giá theo Khoản 2 Điều 3 Luật Khám bệnh, chữa bệnh số 15/2023/QH15 dựa trên dữ liệu thật của bệnh nhân:
     - Trẻ em dưới 6 tuổi (`Age < 6`).
     - Phụ nữ có thai (`IsPregnant == true`).
     - Người khuyết tật nặng / đặc biệt nặng (`IsDisabled == true`).
     - Người cao tuổi từ đủ 75 tuổi trở lên (`Age >= 75`).
     - Người có công với cách mạng (`HasRevolutionaryMerit == true`).
  4. **Lưu vết kiểm toán:** Toàn bộ thông tin người xác nhận, thời gian và lý do cấp cứu được lưu vết qua cấu trúc `PriorityAuditRecord` và phản ánh đầy đủ trong `QueueTicketDto`.

### 1.3. Chứng Minh Đa Tiến Trình (Multi-Instance Concurrency - Nhiệm vụ C)
* **Thực nghiệm chạy 2 tiến trình Backend độc lập:**
  - Khởi chạy 2 process OS riêng biệt cùng chạy `HospitalAI.QueueService.dll`, cùng kết nối vào cơ sở dữ liệu `HospitalAI_DB` trên SQL Server thật (`LAPTOP-QG1C3DNG\SQLEXPRESS`):
    - **Instance Alpha:** PID **25352**, lắng nghe tại `http://127.0.0.1:5110`
    - **Instance Beta:** PID **18532**, lắng nghe tại `http://127.0.0.1:5111`
  - Cấu hình một khung giờ khám có định mức Quota ngặt nghèo: `MaxPatients = 1`.
  - Hai tiến trình cùng nhận 2 yêu cầu đặt lịch độc lập gửi đến vào cùng tích tắc: **`2026-11-22 12:34:06.577`**.
* **Kết quả thực tế ghi nhận:**
  ```text
  Instance Alpha [PID: 25352, URL: http://127.0.0.1:5110, Time: 2026-11-22 12:34:06.577]: 
    HTTP 400 - {"message":"Khung giờ 21:37 - 21:59 vào ngày 2027-03-26 đã đủ số lượng khám (1/1). Quý khách vui lòng chọn khung giờ khác!"}
  Instance Beta  [PID: 18532, URL: http://127.0.0.1:5111, Time: 2026-11-22 12:34:06.577]: 
    HTTP 200 - {"id":"fc94000f-6e5c-4c6f-bd7e-052f45deea41","patientCode":"BN2026246895",...}
  Multi-Process Final Count in SQL Server: 1 (Quota: 1)
  ```
  - **Duy nhất 1 lịch hẹn thành công (HTTP 200), yêu cầu còn lại bị chặn hoàn toàn (HTTP 400).**
  - **Số bản ghi thực tế trong SQL Server đúng bằng 1. Hiện tượng Overbooking bị triệt tiêu 100%.**

---

## 2. Danh Sách Các File Đã Chỉnh Sửa

| STT | Tệp tin | Vị trí | Mục đích thay đổi |
|---|---|---|---|
| 1 | `AppointmentsController.cs` | `src/.../HospitalAI.QueueService/Controllers/` | Thực thi `sp_getapplock` qua ADO.NET trong EF Core transaction, xử lý deadlock 1205, cấm nuốt lỗi khi lấy khóa thất bại; khắc phục `IsStaff()` an toàn khi `User` null. |
| 2 | `QueueDtos.cs` | `src/backend/HospitalAI.Application/DTOs/` | Bổ sung `IsEmergencyConfirmed`, `EmergencyConfirmedBy`, `EmergencyConfirmedAt`, `EmergencyReason` vào DTO cấp số và kết quả hàng chờ. |
| 3 | `QueueService.cs` | `src/backend/HospitalAI.Infrastructure/Services/` | Chặn tin client về `Priority`; chỉ cho phép khẩn cấp khi có xác nhận chuyên môn y tế; đánh giá 5 nhóm ưu tiên theo Điều 3 Luật 15/2023/QH15. |
| 4 | `StaffProfile.cs` | `src/backend/HospitalAI.Domain/Entities/` | Gắn thẻ `[NotMapped]` cho các thuộc tính chứng chỉ mở rộng để tương thích tuyệt đối bảng `dbo.HoSoNhanVien` trong SQL Server. |
| 5 | `QueueConcurrencyAndIdempotencyTests.cs` | `tests/HospitalAI.Tests/` | Cập nhật kịch bản cấp số khẩn cấp chuẩn có xác nhận chuyên môn; bổ sung test chặn client tự ý gán `Priority = Emergency`. |
| 6 | `RealSqlServerValidationTests.cs` | `tests/HospitalAI.Tests/` | Xây dựng 4 bài kiểm thử tích hợp trực tiếp trên SQL Server thật (ADO.NET applock, lock contention timeout, tranh chấp Quota đa controller, và tranh chấp Quota giữa 2 tiến trình OS độc lập). |

---

## 3. Tổng Hợp Kết Quả Kiểm Thử (88/88 Tests Passed)

```text
Starting test execution, please wait...
A total of 1 test files matched the specified pattern.

Passed!  - Failed: 0, Passed: 88, Skipped: 0, Total: 88, Duration: 5.8 s - HospitalAI.Tests.dll (net9.0)
```

### Phân Loại Kết Quả Kiểm Thử:
1. **Real SQL Server Concurrency & Multi-Process Tests:** 4/4 Passed (100%)
   - `TestAdoNetSpGetAppLock_InsideEfCoreTransaction`: Passed
   - `RealSqlServer_SpGetAppLock_LockContention_ReturnsTimeoutCode`: Passed
   - `RealSqlServer_TwoConcurrentAppointments_ContendingForLastSlot_MustPreventOverbooking`: Passed
   - `MultiProcess_TwoIndependentBackendProcesses_ContendingForSingleSlot_MustPreventOverbooking`: Passed
2. **Queue Concurrency, Priority & Idempotency Tests:** 12/12 Passed (100%)
   - Bao gồm test chống duplicate QR, cấp số đồng thời, thứ tự ưu tiên Điều 3 Luật 15/2023/QH15, và từ chối cấp cứu khi không có xác nhận chuyên môn.
3. **RBAC & 8 Actors Segregation Tests:** 19/19 Passed (100%)
   - Xác nhận độc lập quyền hạn giữa 8 Actor, đặc biệt là sự tách biệt tuyệt đối giữa `Triage` (Nhân viên sàng lọc y tế) và `Nurse` (Nhân viên Y tế).
4. **Clinical, Prescriptions & Billing Tests:** 53/53 Passed (100%)
   - Xác thực nghiệp vụ EMR, kiểm tra đơn thuốc hết hạn, chữ ký điện tử HMAC, chống thanh toán giả mạo và chống xuất kho trùng lặp.

---

## 4. Những Giới Hạn Còn Tồn Tại (Demo Limitations)

1. **Khóa Ứng Dụng Phân Tán:** Thủ tục `sp_getapplock` phụ thuộc vào engine Microsoft SQL Server. Nếu triển khai trên các hệ quản trị khác (như PostgreSQL hay MySQL), cần chuyển đổi tương đương sang `pg_advisory_xact_lock` hoặc `GET_LOCK()`.
2. **Lưu Vết Khẩn Cấp Y Tế:** Thông tin nhân sự chuyên môn xác nhận cấp cứu hiện được lưu trữ an toàn trong bộ nhớ `ConcurrentDictionary` và trả về qua API DTO. Để giữ ổn định cấu trúc DB cho buổi demo đồ án, hệ thống chưa tạo thêm bảng SQL mới.
3. **Chữ Ký Số:** Chữ ký số trên bệnh án điện tử và đơn thuốc hiện được ký bằng thuật toán HMAC-SHA256 mô phỏng chuẩn Bộ Y tế, có cơ chế che chắn PII và chống rà quét ID, chưa tích hợp thiết bị ký số phần cứng (HSM/SmartCA) của các nhà cung cấp chứng thư số công cộng thương mại.

---

## 5. Đề Xuất Đóng Băng Phiên Bản (Freeze Recommendation)

* **Trạng thái:** Toàn bộ 4 nhiệm vụ kỹ thuật và nghiệp vụ đều đạt 100% tiêu chí nghiệm thu khắt khe nhất.
* **Khuyến nghị:** **Đóng băng phiên bản Hospital AI v2.6.2-FINAL** trên nhánh `audit/post-second-audit-hardening`.
* **Kế hoạch tiếp theo:** Không thực hiện thêm bất kỳ thay đổi mã nguồn nào; giữ nguyên toàn bộ tên 8 Actor và kịch bản đã kiểm chứng để sẵn sàng tiến hành Demo và bảo vệ đồ án tốt nghiệp.
