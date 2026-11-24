"""
Script tạo file SVG đồ họa Vector chuẩn Swimlane UML Activity Diagram
Cho 2 quy trình: Khám Lần Đầu và Tái Khám Ngoại Trú
"""
import os

SWIMLANES = [
    {"id": "patient", "name": "Bệnh nhân", "sub": "Patient", "color": "#e0f2fe", "header": "#0284c7"},
    {"id": "system", "name": "Kiosk & Hệ thống", "sub": "Kiosk / AI Server", "color": "#f0f9ff", "header": "#0369a1"},
    {"id": "reception", "name": "Nhân viên tiếp nhận", "sub": "Receptionist", "color": "#fef3c7", "header": "#d97706"},
    {"id": "triage", "name": "Nhân viên sàng lọc", "sub": "Triage Nurse", "color": "#ede9fe", "header": "#7c3aed"},
    {"id": "doctor", "name": "Bác sĩ lâm sàng", "sub": "Doctor", "color": "#dcfce7", "header": "#16a34a"},
    {"id": "cls", "name": "Nhân viên Y tế (CLS)", "sub": "Lab Tech / Radiology", "color": "#fce7f3", "header": "#db2777"},
    {"id": "cashier", "name": "Thu ngân", "sub": "Cashier", "color": "#fee2e2", "header": "#dc2626"},
    {"id": "pharmacy", "name": "Nhà thuốc", "sub": "Pharmacist", "color": "#f3e8ff", "header": "#9333ea"},
]

def generate_swimlane_svg(title, nodes, connections, filename):
    lane_width = 190
    total_lanes = len(SWIMLANES)
    header_height = 70
    max_y = max(n.get("y", 0) for n in nodes) + 120
    total_width = total_lanes * lane_width + 40
    total_height = max_y

    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_width} {total_height}" width="{total_width}" height="{total_height}" style="background-color: #ffffff; font-family: Segoe UI, Roboto, Helvetica, Arial, sans-serif;">')
    
    # Defs: Markers for arrows
    svg.append('''<defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
      </marker>
      <marker id="arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
      </marker>
      <marker id="arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
      </marker>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.08" />
      </filter>
    </defs>''')

    # Title Banner
    svg.append(f'<rect x="20" y="10" width="{total_width-40}" height="40" rx="8" fill="#0f172a" />')
    svg.append(f'<text x="{total_width/2}" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff" letter-spacing="0.5">{title.upper()}</text>')

    start_x = 20
    start_y = 60

    # Draw Lanes background and headers
    lane_x_map = {}
    for i, lane in enumerate(SWIMLANES):
        lx = start_x + i * lane_width
        lane_x_map[lane["id"]] = lx + lane_width / 2

        # Lane Background
        svg.append(f'<rect x="{lx}" y="{start_y}" width="{lane_width}" height="{total_height - start_y - 20}" fill="{lane["color"]}" fill-opacity="0.25" stroke="#cbd5e1" stroke-width="1" />')
        # Lane Header
        svg.append(f'<rect x="{lx}" y="{start_y}" width="{lane_width}" height="{header_height}" fill="{lane["header"]}" stroke="#cbd5e1" stroke-width="1" />')
        svg.append(f'<text x="{lx + lane_width/2}" y="{start_y + 28}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#ffffff">{lane["name"]}</text>')
        svg.append(f'<text x="{lx + lane_width/2}" y="{start_y + 48}" text-anchor="middle" font-size="10.5" font-weight="500" fill="#ffffff" fill-opacity="0.85">({lane["sub"]})</text>')

    # Draw Connections (Lines & Arrows)
    for conn in connections:
        p1 = conn["from"]
        p2 = conn["to"]
        label = conn.get("label", "")
        color = conn.get("color", "#334155")
        marker = "arrow-green" if color == "#16a34a" else ("arrow-red" if color == "#dc2626" else "arrow")
        
        # Waypoints or direct path
        pts = conn.get("points")
        if pts:
            path_d = f"M {pts[0][0]} {pts[0][1]} "
            for pt in pts[1:]:
                path_d += f"L {pt[0]} {pt[1]} "
            svg.append(f'<path d="{path_d}" fill="none" stroke="{color}" stroke-width="1.8" marker-end="url(#{marker})" />')
            if label and len(pts) >= 2:
                mid_x = (pts[0][0] + pts[1][0]) / 2 + conn.get("lbl_dx", 0)
                mid_y = (pts[0][1] + pts[1][1]) / 2 + conn.get("lbl_dy", -5)
                svg.append(f'<rect x="{mid_x-25}" y="{mid_y-9}" width="50" height="16" rx="4" fill="#ffffff" stroke="{color}" stroke-width="0.8" opacity="0.95"/>')
                svg.append(f'<text x="{mid_x}" y="{mid_y+3}" text-anchor="middle" font-size="10" font-weight="600" fill="{color}">{label}</text>')
        else:
            x1, y1 = p1
            x2, y2 = p2
            if abs(x1 - x2) < 5: # Vertical
                svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.8" marker-end="url(#{marker})" />')
                if label:
                    mid_y = (y1 + y2) / 2
                    svg.append(f'<rect x="{x1+6}" y="{mid_y-8}" width="50" height="16" rx="4" fill="#ffffff" stroke="{color}" stroke-width="0.8"/>')
                    svg.append(f'<text x="{x1+31}" y="{mid_y+4}" text-anchor="middle" font-size="10" font-weight="600" fill="{color}">{label}</text>')
            elif abs(y1 - y2) < 5: # Horizontal
                svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.8" marker-end="url(#{marker})" />')
                if label:
                    mid_x = (x1 + x2) / 2
                    svg.append(f'<rect x="{mid_x-25}" y="{y1-18}" width="50" height="16" rx="4" fill="#ffffff" stroke="{color}" stroke-width="0.8"/>')
                    svg.append(f'<text x="{mid_x}" y="{y1-6}" text-anchor="middle" font-size="10" font-weight="600" fill="{color}">{label}</text>')
            else: # Elbow L-path
                mid_y = (y1 + y2) / 2
                path_d = f"M {x1} {y1} L {x1} {mid_y} L {x2} {mid_y} L {x2} {y2}"
                svg.append(f'<path d="{path_d}" fill="none" stroke="{color}" stroke-width="1.8" marker-end="url(#{marker})" />')
                if label:
                    svg.append(f'<rect x="{x1+conn.get("lbl_dx", 8)}" y="{mid_y-conn.get("lbl_dy", 8)}" width="50" height="16" rx="4" fill="#ffffff" stroke="{color}" stroke-width="0.8"/>')
                    svg.append(f'<text x="{x1+conn.get("lbl_dx", 8)+25}" y="{mid_y-conn.get("lbl_dy", 8)+12}" text-anchor="middle" font-size="10" font-weight="600" fill="{color}">{label}</text>')

    # Draw Nodes
    for n in nodes:
        ntype = n.get("type", "activity")
        cx = n["x"]
        cy = n["y"]
        text = n.get("text", "")
        lines = text.split("\n")

        if ntype == "start":
            svg.append(f'<circle cx="{cx}" cy="{cy}" r="14" fill="#0f172a" stroke="#475569" stroke-width="2" />')
        elif ntype == "end":
            svg.append(f'<circle cx="{cx}" cy="{cy}" r="15" fill="#ffffff" stroke="#0f172a" stroke-width="2" />')
            svg.append(f'<circle cx="{cx}" cy="{cy}" r="9" fill="#0f172a" />')
        elif ntype == "decision":
            w = n.get("w", 110)
            h = n.get("h", 48)
            pts = f"{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}"
            svg.append(f'<polygon points="{pts}" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.8" filter="url(#shadow)" />')
            start_text_y = cy - (len(lines)-1)*6 + 3
            for idx, l in enumerate(lines):
                svg.append(f'<text x="{cx}" y="{start_text_y + idx*12}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#854d0e">{l}</text>')
        elif ntype == "fork" or ntype == "join":
            w = n.get("w", 120)
            svg.append(f'<rect x="{cx-w/2}" y="{cy-3}" width="{w}" height="6" rx="3" fill="#0f172a" />')
        else: # activity
            w = n.get("w", 148)
            h = n.get("h", 44)
            rx = 10
            fill = n.get("fill", "#ffffff")
            stroke = n.get("stroke", "#0284c7")
            svg.append(f'<rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="1.6" filter="url(#shadow)" />')
            start_text_y = cy - (len(lines)-1)*7 + 4
            for idx, l in enumerate(lines):
                svg.append(f'<text x="{cx}" y="{start_text_y + idx*13}" text-anchor="middle" font-size="11" font-weight="600" fill="#0f172a">{l}</text>')

    svg.append('</svg>')
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write("\n".join(svg))
    print(f"Generated: {filename}")

if __name__ == "__main__":
    lane_x = {lane["id"]: 20 + idx * 190 + 95 for idx, lane in enumerate(SWIMLANES)}
    
    # =========================================================================
    # DIAGRAM 1: KHÁM LẦN ĐẦU (INITIAL VISIT)
    # =========================================================================
    nodes_1 = [
        {"id": "start", "type": "start", "x": lane_x["patient"], "y": 150},
        {"id": "dec_reg_type", "type": "decision", "x": lane_x["patient"], "y": 210, "text": "Hình thức\nđăng ký?", "w": 110, "h": 50},
        
        # Nhánh Online
        {"id": "book_online", "type": "activity", "x": lane_x["patient"], "y": 290, "text": "Đặt lịch online\ntrên Web/App"},
        {"id": "sys_qr_gen", "type": "activity", "x": lane_x["system"], "y": 290, "text": "Xác nhận lịch hẹn\n& Cấp mã QR"},
        {"id": "pat_arrive_onl", "type": "activity", "x": lane_x["patient"], "y": 360, "text": "Đến bệnh viện\ntheo lịch hẹn"},

        # Nhánh Trực tiếp
        {"id": "rec_check_id", "type": "activity", "x": lane_x["reception"], "y": 290, "text": "Kiểm tra CCCD,\nBHYT & Hồ sơ"},

        # Sàng lọc
        {"id": "triage_checkin", "type": "activity", "x": lane_x["triage"], "y": 430, "text": "Xác thực thông tin\n& Thực hiện check-in"},
        {"id": "dec_valid_info", "type": "decision", "x": lane_x["triage"], "y": 500, "text": "Thông tin\nhợp lệ?", "w": 105, "h": 46},
        {"id": "rec_support_info", "type": "activity", "x": lane_x["reception"], "y": 500, "text": "Hỗ trợ bổ sung\nthông tin hồ sơ"},
        {"id": "triage_vitals", "type": "activity", "x": lane_x["triage"], "y": 570, "text": "Đo sinh hiệu, đánh giá\ntriệu chứng & phân khoa"},

        # Xác nhận phòng & thu phí trước
        {"id": "sys_confirm_room", "type": "activity", "x": lane_x["system"], "y": 640, "text": "Xác nhận lượt khám\nvà phòng khám"},
        {"id": "dec_fee_before", "type": "decision", "x": lane_x["system"], "y": 710, "text": "Cần thu phí\nkhám trước?", "w": 110, "h": 46},
        {"id": "cash_fee_before", "type": "activity", "x": lane_x["cashier"], "y": 710, "text": "Thu phí khám\nban đầu"},

        # Kiosk quét QR & Cấp STT
        {"id": "pat_scan_kiosk", "type": "activity", "x": lane_x["patient"], "y": 780, "text": "Đến Kiosk và\nquét mã QR"},
        {"id": "dec_kiosk_valid", "type": "decision", "x": lane_x["system"], "y": 780, "text": "Đủ điều kiện\ncấp STT?", "w": 110, "h": 46},
        {"id": "sys_kiosk_issue", "type": "activity", "x": lane_x["system"], "y": 850, "text": "Tự động cấp STT &\nIn phiếu hàng chờ"},

        # Khám lâm sàng
        {"id": "doc_call_pat", "type": "activity", "x": lane_x["doctor"], "y": 920, "text": "Gọi số & Tiếp nhận\nbệnh nhân vào khám"},
        {"id": "doc_soap_emr", "type": "activity", "x": lane_x["doctor"], "y": 990, "text": "Khám lâm sàng &\nGhi hồ sơ SOAP EMR"},
        {"id": "dec_need_cls", "type": "decision", "x": lane_x["doctor"], "y": 1060, "text": "Cần cận\nlâm sàng?", "w": 110, "h": 46},

        # Nhánh CLS
        {"id": "doc_order_cls", "type": "activity", "x": lane_x["doctor"], "y": 1130, "text": "Bác sĩ chỉ định\ndịch vụ CLS"},
        {"id": "dec_pay_cls", "type": "decision", "x": lane_x["cashier"], "y": 1130, "text": "Cần thanh toán\nCLS trước?", "w": 110, "h": 46},
        {"id": "cash_pay_cls", "type": "activity", "x": lane_x["cashier"], "y": 1200, "text": "Thu ngân xử lý\nthanh toán CLS"},
        {"id": "cls_perform", "type": "activity", "x": lane_x["cls"], "y": 1200, "text": "Thực hiện kỹ thuật CLS\n& Ký chứng thực kết quả"},
        {"id": "pat_return_scan", "type": "activity", "x": lane_x["patient"], "y": 1270, "text": "Quét QR xác nhận\nquay lại phòng khám"},
        {"id": "doc_review_cls", "type": "activity", "x": lane_x["doctor"], "y": 1270, "text": "Đọc kết quả CLS &\nĐánh giá tổn thương"},

        # Kết luận & Kê đơn
        {"id": "doc_conclude", "type": "activity", "x": lane_x["doctor"], "y": 1350, "text": "Bác sĩ kết luận,\nlên đơn điều trị & ký số"},
        {"id": "dec_next_action", "type": "decision", "x": lane_x["doctor"], "y": 1430, "text": "Chỉ định\ntiếp theo?", "w": 110, "h": 50},

        # Nhánh Nhập viện / Chuyển viện
        {"id": "doc_admit", "type": "activity", "x": lane_x["doctor"], "y": 1510, "text": "Lập chỉ định\nnhập/chuyển viện"},
        {"id": "cash_settle_admit", "type": "activity", "x": lane_x["cashier"], "y": 1510, "text": "Đối soát chi phí\nkhám ngoại trú"},
        {"id": "rec_handover", "type": "activity", "x": lane_x["reception"], "y": 1570, "text": "Bàn giao sang quy trình\nnhập/chuyển viện"},
        {"id": "end_admit", "type": "end", "x": lane_x["patient"], "y": 1570},

        # Nhánh Ngoại trú
        {"id": "cash_billing", "type": "activity", "x": lane_x["cashier"], "y": 1590, "text": "Thu ngân quyết toán\nviện phí & BHYT"},
        {"id": "dec_has_med", "type": "decision", "x": lane_x["pharmacy"], "y": 1590, "text": "Có đơn\nthuốc?", "w": 90, "h": 46},
        {"id": "pharm_dispense", "type": "activity", "x": lane_x["pharmacy"], "y": 1660, "text": "Kiểm tra đơn PAID &\nCấp phát thuốc trừ kho"},
        {"id": "pat_finish_all", "type": "activity", "x": lane_x["patient"], "y": 1660, "text": "Lưu diễn biến EMR,\nnhận thuốc & dặn dò"},
        {"id": "end_normal", "type": "end", "x": lane_x["patient"], "y": 1730},
    ]

    connections_1 = [
        {"from": (lane_x["patient"], 164), "to": (lane_x["patient"], 185)},
        {"from": (lane_x["patient"], 235), "to": (lane_x["patient"], 268), "label": "[Online]", "color": "#0284c7"},
        {"from": (lane_x["patient"]+55, 210), "to": (lane_x["reception"]-74, 290), "label": "[Trực tiếp]", "color": "#d97706", "points": [(lane_x["patient"]+55, 210), (lane_x["reception"], 210), (lane_x["reception"], 268)]},
        
        {"from": (lane_x["patient"]+74, 290), "to": (lane_x["system"]-74, 290)},
        {"from": (lane_x["system"]-74, 305), "to": (lane_x["patient"]+74, 360), "points": [(lane_x["system"]-60, 312), (lane_x["system"]-60, 360), (lane_x["patient"]+74, 360)]},
        {"from": (lane_x["patient"], 382), "to": (lane_x["triage"], 408), "points": [(lane_x["patient"], 410), (lane_x["triage"], 410)]},
        {"from": (lane_x["reception"], 312), "to": (lane_x["triage"], 408), "points": [(lane_x["reception"], 410), (lane_x["triage"], 410)]},
        
        {"from": (lane_x["triage"], 452), "to": (lane_x["triage"], 477)},
        {"from": (lane_x["triage"]-52, 500), "to": (lane_x["reception"]+74, 500), "label": "[Không]", "color": "#dc2626"},
        {"from": (lane_x["reception"], 478), "to": (lane_x["triage"], 430), "points": [(lane_x["reception"], 445), (lane_x["triage"]-74, 445)]},
        {"from": (lane_x["triage"], 523), "to": (lane_x["triage"], 548), "label": "[Có]", "color": "#16a34a"},
        {"from": (lane_x["triage"], 592), "to": (lane_x["system"], 618), "points": [(lane_x["triage"], 610), (lane_x["system"], 610), (lane_x["system"], 618)]},
        
        {"from": (lane_x["system"], 662), "to": (lane_x["system"], 687)},
        {"from": (lane_x["system"]+55, 710), "to": (lane_x["cashier"]-74, 710), "label": "[Có]", "color": "#dc2626"},
        {"from": (lane_x["system"], 733), "to": (lane_x["patient"], 758), "label": "[Không]", "color": "#16a34a", "points": [(lane_x["system"], 745), (lane_x["patient"], 745), (lane_x["patient"], 758)]},
        {"from": (lane_x["cashier"], 732), "to": (lane_x["patient"], 758), "points": [(lane_x["cashier"], 755), (lane_x["patient"], 755), (lane_x["patient"], 758)]},
        
        {"from": (lane_x["patient"]+74, 780), "to": (lane_x["system"]-55, 780)},
        {"from": (lane_x["system"], 803), "to": (lane_x["system"], 828), "label": "[Đủ ĐK]", "color": "#16a34a"},
        {"from": (lane_x["system"], 872), "to": (lane_x["doctor"], 898), "points": [(lane_x["system"], 885), (lane_x["doctor"], 885), (lane_x["doctor"], 898)]},
        
        {"from": (lane_x["doctor"], 942), "to": (lane_x["doctor"], 968)},
        {"from": (lane_x["doctor"], 1012), "to": (lane_x["doctor"], 1037)},
        
        # Nhánh có CLS
        {"from": (lane_x["doctor"], 1083), "to": (lane_x["doctor"], 1108), "label": "[Có CLS]", "color": "#7c3aed"},
        {"from": (lane_x["doctor"]+74, 1130), "to": (lane_x["cashier"]-55, 1130)},
        {"from": (lane_x["cashier"], 1153), "to": (lane_x["cashier"], 1178), "label": "[Thu tiền]", "color": "#dc2626"},
        {"from": (lane_x["cashier"], 1222), "to": (lane_x["cls"]+74, 1200), "points": [(lane_x["cashier"], 1240), (lane_x["cls"]+100, 1240), (lane_x["cls"]+100, 1200), (lane_x["cls"]+74, 1200)]},
        {"from": (lane_x["cls"]-74, 1200), "to": (lane_x["patient"]+74, 1270), "points": [(lane_x["cls"]-90, 1200), (lane_x["cls"]-90, 1270), (lane_x["patient"]+74, 1270)]},
        {"from": (lane_x["patient"]+74, 1270), "to": (lane_x["doctor"]-74, 1270)},
        {"from": (lane_x["doctor"], 1292), "to": (lane_x["doctor"], 1328)},
        
        # Không CLS đi thẳng kết luận
        {"from": (lane_x["doctor"]-55, 1060), "to": (lane_x["doctor"]-74, 1350), "label": "[Không CLS]", "color": "#16a34a", "points": [(lane_x["doctor"]-85, 1060), (lane_x["doctor"]-85, 1350), (lane_x["doctor"]-74, 1350)]},
        
        {"from": (lane_x["doctor"], 1372), "to": (lane_x["doctor"], 1405)},
        
        # Phân nhánh sau kết luận
        {"from": (lane_x["doctor"]-55, 1430), "to": (lane_x["doctor"]-40, 1488), "label": "[Nhập/Chuyển viện]", "color": "#d97706", "points": [(lane_x["doctor"]-80, 1430), (lane_x["doctor"]-80, 1475), (lane_x["doctor"], 1475), (lane_x["doctor"], 1488)]},
        {"from": (lane_x["doctor"]+74, 1510), "to": (lane_x["cashier"]-74, 1510)},
        {"from": (lane_x["cashier"]-74, 1525), "to": (lane_x["reception"]+74, 1570), "points": [(lane_x["reception"]+100, 1525), (lane_x["reception"]+100, 1570), (lane_x["reception"]+74, 1570)]},
        {"from": (lane_x["reception"]-74, 1570), "to": (lane_x["patient"]+15, 1570)},

        # Điều trị ngoại trú
        {"from": (lane_x["doctor"]+55, 1430), "to": (lane_x["cashier"], 1568), "label": "[Ngoại trú]", "color": "#16a34a", "points": [(lane_x["cashier"], 1430), (lane_x["cashier"], 1568)]},
        {"from": (lane_x["cashier"]+74, 1590), "to": (lane_x["pharmacy"]-45, 1590)},
        {"from": (lane_x["pharmacy"], 1613), "to": (lane_x["pharmacy"], 1638), "label": "[Có thuốc]", "color": "#7c3aed"},
        {"from": (lane_x["pharmacy"]-74, 1660), "to": (lane_x["patient"]+74, 1660)},
        {"from": (lane_x["pharmacy"]+45, 1590), "to": (lane_x["patient"]+74, 1660), "label": "[Không thuốc]", "color": "#64748b", "points": [(lane_x["pharmacy"]+60, 1590), (lane_x["pharmacy"]+60, 1700), (lane_x["patient"]+50, 1700), (lane_x["patient"], 1682)]},
        {"from": (lane_x["patient"], 1682), "to": (lane_x["patient"], 1715)}
    ]

    generate_swimlane_svg("LƯU ĐỒ QUY TRÌNH KHÁM NGOẠI TRÚ LẦN ĐẦU (SWIMLANE ACTIVITY DIAGRAM)", nodes_1, connections_1, "docs/diagrams/Quy_Trinh_Kham_Ngoai_Tru_Lan_Dau_Swimlane.svg")

    # =========================================================================
    # DIAGRAM 2: TÁI KHÁM (FOLLOW-UP VISIT)
    # =========================================================================
    nodes_2 = [
        {"id": "start", "type": "start", "x": lane_x["patient"], "y": 150},
        {"id": "pat_arrive_follow", "type": "activity", "x": lane_x["patient"], "y": 220, "text": "Bệnh nhân đến tái khám\ntheo giấy hẹn / QR"},
        
        # Tiếp nhận tra cứu
        {"id": "rec_check_follow", "type": "activity", "x": lane_x["reception"], "y": 220, "text": "Kiểm tra giấy hẹn/QR\n& Tra cứu hồ sơ cũ"},
        {"id": "dec_valid_follow", "type": "decision", "x": lane_x["reception"], "y": 290, "text": "Giấy hẹn &\nTT hợp lệ?", "w": 105, "h": 46},
        {"id": "rec_verify_follow", "type": "activity", "x": lane_x["reception"], "y": 360, "text": "Tiếp nhận hỗ trợ\nxác minh điều kiện"},
        {"id": "dec_eligible_follow", "type": "decision", "x": lane_x["reception"], "y": 430, "text": "Đủ điều kiện\ntái khám?", "w": 105, "h": 46},
        {"id": "rec_switch_normal", "type": "activity", "x": lane_x["reception"], "y": 500, "text": "Chuyển đăng ký khám\nthường hoặc hẹn lại"},
        {"id": "end_not_eligible", "type": "end", "x": lane_x["reception"], "y": 560},

        # Hợp lệ -> Giữ mã BN cũ
        {"id": "rec_keep_id", "type": "activity", "x": lane_x["reception"], "y": 350, "text": "Giữ mã bệnh nhân cũ,\ntạo lượt tái khám mới", "fill": "#fef9c3", "stroke": "#ca8a04"},
        {"id": "rec_issue_follow_qr", "type": "activity", "x": lane_x["reception"], "y": 420, "text": "Xác nhận hoặc cấp mã QR\ncho lượt tái khám"},

        # Sàng lọc
        {"id": "triage_follow_vitals", "type": "activity", "x": lane_x["triage"], "y": 490, "text": "Đo sinh hiệu ngày tái khám\n& cập nhật triệu chứng"},
        {"id": "triage_confirm_dept", "type": "activity", "x": lane_x["triage"], "y": 560, "text": "Xác nhận chuyên khoa\n& phòng Bác sĩ hẹn"},

        # Thu phí khám trước (nếu có)
        {"id": "dec_fee_follow", "type": "decision", "x": lane_x["system"], "y": 630, "text": "Cần thu phí\nkhám trước?", "w": 110, "h": 46},
        {"id": "cash_fee_follow", "type": "activity", "x": lane_x["cashier"], "y": 630, "text": "Thu phí khám\ntái khám"},

        # Kiosk quét QR & Cấp STT Ưu tiên
        {"id": "pat_scan_kiosk_2", "type": "activity", "x": lane_x["patient"], "y": 700, "text": "Đến Kiosk và\nquét mã QR tái khám"},
        {"id": "dec_kiosk_valid_2", "type": "decision", "x": lane_x["system"], "y": 700, "text": "Đủ điều kiện\ncấp STT?", "w": 110, "h": 46},
        {"id": "sys_issue_follow_stt", "type": "activity", "x": lane_x["system"], "y": 770, "text": "Cấp STT Ưu tiên phòng cũ\n& Cập nhật hàng chờ"},

        # Bác sĩ khám & So sánh EMR cũ
        {"id": "doc_call_follow", "type": "activity", "x": lane_x["doctor"], "y": 840, "text": "Gọi số & Tiếp nhận\nbệnh nhân tái khám"},
        {"id": "doc_view_old_emr", "type": "activity", "x": lane_x["doctor"], "y": 910, "text": "Xem toàn bộ hồ sơ cũ,\nkết quả & đơn thuốc trước", "fill": "#ecfdf5", "stroke": "#059669"},
        {"id": "doc_eval_response", "type": "activity", "x": lane_x["doctor"], "y": 980, "text": "Khám lâm sàng & Đánh giá\nđáp ứng phác đồ trước"},

        # CLS kiểm tra lại
        {"id": "dec_cls_follow", "type": "decision", "x": lane_x["doctor"], "y": 1050, "text": "Cần CLS\ntheo dõi?", "w": 110, "h": 46},
        {"id": "doc_order_cls_2", "type": "activity", "x": lane_x["doctor"], "y": 1120, "text": "Lập chỉ định CLS\nkiểm tra chỉ số"},
        {"id": "cash_pay_cls_2", "type": "activity", "x": lane_x["cashier"], "y": 1120, "text": "Thu phí dịch vụ\nCLS kiểm tra"},
        {"id": "cls_perform_2", "type": "activity", "x": lane_x["cls"], "y": 1190, "text": "Thực hiện CLS theo dõi\n& Ký chứng thực kết quả"},
        {"id": "pat_return_scan_2", "type": "activity", "x": lane_x["patient"], "y": 1260, "text": "Quét QR xác nhận\nquay lại phòng khám"},
        {"id": "doc_compare_cls", "type": "activity", "x": lane_x["doctor"], "y": 1260, "text": "Đọc kết quả mới, so sánh\nchỉ số cũ - mới"},

        # Kết luận điều chỉnh
        {"id": "doc_conclude_follow", "type": "activity", "x": lane_x["doctor"], "y": 1340, "text": "Kết luận, điều chỉnh điều trị\n(chỉnh liều, đổi phác đồ)"},
        {"id": "dec_next_follow", "type": "decision", "x": lane_x["doctor"], "y": 1420, "text": "Chỉ định\ntiếp theo?", "w": 110, "h": 50},

        # Nhập viện / Chuyển viện
        {"id": "doc_admit_2", "type": "activity", "x": lane_x["doctor"], "y": 1490, "text": "Chỉ định nhập viện\nhoặc chuyển tuyến"},
        {"id": "cash_settle_admit_2", "type": "activity", "x": lane_x["cashier"], "y": 1490, "text": "Đối soát chi phí\nkhám ngoại trú"},
        {"id": "rec_handover_2", "type": "activity", "x": lane_x["reception"], "y": 1550, "text": "Bàn giao hồ sơ EMR\nsang quy trình liên quan"},
        {"id": "end_admit_2", "type": "end", "x": lane_x["patient"], "y": 1550},

        # Ngoại trú tái khám
        {"id": "cash_billing_follow", "type": "activity", "x": lane_x["cashier"], "y": 1570, "text": "Quyết toán viện phí\n& Chế độ BHYT"},
        {"id": "dec_has_med_2", "type": "decision", "x": lane_x["pharmacy"], "y": 1570, "text": "Có đơn\nthuốc?", "w": 90, "h": 46},
        {"id": "pharm_dispense_2", "type": "activity", "x": lane_x["pharmacy"], "y": 1640, "text": "Kiểm tra đơn PAID &\nCấp phát thuốc tái khám"},
        {"id": "pat_finish_follow", "type": "activity", "x": lane_x["patient"], "y": 1640, "text": "Lưu diễn biến điều trị,\nhẹn tái khám đợt tiếp"},
        {"id": "end_follow_all", "type": "end", "x": lane_x["patient"], "y": 1710},
    ]

    connections_2 = [
        {"from": (lane_x["patient"], 164), "to": (lane_x["patient"], 198)},
        {"from": (lane_x["patient"]+74, 220), "to": (lane_x["reception"]-74, 220)},
        {"from": (lane_x["reception"], 242), "to": (lane_x["reception"], 267)},
        
        # Rẽ nhánh xác minh
        {"from": (lane_x["reception"]+52, 290), "to": (lane_x["reception"]+74, 360), "label": "[Không]", "color": "#dc2626", "points": [(lane_x["reception"]+90, 290), (lane_x["reception"]+90, 360), (lane_x["reception"]+74, 360)]},
        {"from": (lane_x["reception"], 382), "to": (lane_x["reception"], 407)},
        {"from": (lane_x["reception"]+52, 430), "to": (lane_x["reception"], 478), "label": "[Không đủ ĐK]", "color": "#dc2626", "points": [(lane_x["reception"]+85, 430), (lane_x["reception"]+85, 478), (lane_x["reception"], 478)]},
        {"from": (lane_x["reception"], 522), "to": (lane_x["reception"], 545)},
        {"from": (lane_x["reception"]-52, 430), "to": (lane_x["reception"]-74, 350), "label": "[Đủ ĐK]", "color": "#16a34a", "points": [(lane_x["reception"]-85, 430), (lane_x["reception"]-85, 350), (lane_x["reception"]-74, 350)]},
        
        {"from": (lane_x["reception"], 313), "to": (lane_x["reception"], 328), "label": "[Có]", "color": "#16a34a"},
        {"from": (lane_x["reception"], 372), "to": (lane_x["reception"], 398)},
        {"from": (lane_x["reception"], 442), "to": (lane_x["triage"], 468), "points": [(lane_x["reception"], 460), (lane_x["triage"], 460), (lane_x["triage"], 468)]},
        
        {"from": (lane_x["triage"], 512), "to": (lane_x["triage"], 538)},
        {"from": (lane_x["triage"], 582), "to": (lane_x["system"], 607), "points": [(lane_x["triage"], 600), (lane_x["system"], 600), (lane_x["system"], 607)]},
        
        {"from": (lane_x["system"]+55, 630), "to": (lane_x["cashier"]-74, 630), "label": "[Có]", "color": "#dc2626"},
        {"from": (lane_x["system"], 653), "to": (lane_x["patient"], 678), "label": "[Không]", "color": "#16a34a", "points": [(lane_x["system"], 665), (lane_x["patient"], 665), (lane_x["patient"], 678)]},
        {"from": (lane_x["cashier"], 652), "to": (lane_x["patient"], 678), "points": [(lane_x["cashier"], 675), (lane_x["patient"], 675), (lane_x["patient"], 678)]},
        
        {"from": (lane_x["patient"]+74, 700), "to": (lane_x["system"]-55, 700)},
        {"from": (lane_x["system"], 723), "to": (lane_x["system"], 748), "label": "[Đủ ĐK]", "color": "#16a34a"},
        {"from": (lane_x["system"], 792), "to": (lane_x["doctor"], 818), "points": [(lane_x["system"], 805), (lane_x["doctor"], 805), (lane_x["doctor"], 818)]},
        
        {"from": (lane_x["doctor"], 862), "to": (lane_x["doctor"], 888)},
        {"from": (lane_x["doctor"], 932), "to": (lane_x["doctor"], 958)},
        {"from": (lane_x["doctor"], 1002), "to": (lane_x["doctor"], 1027)},
        
        # Nhánh CLS kiểm tra lại
        {"from": (lane_x["doctor"], 1073), "to": (lane_x["doctor"], 1098), "label": "[Có CLS]", "color": "#7c3aed"},
        {"from": (lane_x["doctor"]+74, 1120), "to": (lane_x["cashier"]-74, 1120)},
        {"from": (lane_x["cashier"], 1142), "to": (lane_x["cls"]+74, 1190), "points": [(lane_x["cashier"], 1165), (lane_x["cls"]+100, 1165), (lane_x["cls"]+100, 1190), (lane_x["cls"]+74, 1190)]},
        {"from": (lane_x["cls"]-74, 1190), "to": (lane_x["patient"]+74, 1260), "points": [(lane_x["cls"]-90, 1190), (lane_x["cls"]-90, 1260), (lane_x["patient"]+74, 1260)]},
        {"from": (lane_x["patient"]+74, 1260), "to": (lane_x["doctor"]-74, 1260)},
        {"from": (lane_x["doctor"], 1282), "to": (lane_x["doctor"], 1318)},
        
        # Không CLS
        {"from": (lane_x["doctor"]-55, 1050), "to": (lane_x["doctor"]-74, 1340), "label": "[Không CLS]", "color": "#16a34a", "points": [(lane_x["doctor"]-85, 1050), (lane_x["doctor"]-85, 1340), (lane_x["doctor"]-74, 1340)]},
        
        {"from": (lane_x["doctor"], 1362), "to": (lane_x["doctor"], 1395)},
        
        # Phân nhánh sau kết luận
        {"from": (lane_x["doctor"]-55, 1420), "to": (lane_x["doctor"], 1468), "label": "[Nhập/Chuyển viện]", "color": "#d97706", "points": [(lane_x["doctor"]-80, 1420), (lane_x["doctor"]-80, 1455), (lane_x["doctor"], 1455), (lane_x["doctor"], 1468)]},
        {"from": (lane_x["doctor"]+74, 1490), "to": (lane_x["cashier"]-74, 1490)},
        {"from": (lane_x["cashier"]-74, 1505), "to": (lane_x["reception"]+74, 1550), "points": [(lane_x["reception"]+100, 1505), (lane_x["reception"]+100, 1550), (lane_x["reception"]+74, 1550)]},
        {"from": (lane_x["reception"]-74, 1550), "to": (lane_x["patient"]+15, 1550)},

        # Điều trị ngoại trú tái khám
        {"from": (lane_x["doctor"]+55, 1420), "to": (lane_x["cashier"], 1548), "label": "[Ngoại trú]", "color": "#16a34a", "points": [(lane_x["cashier"], 1420), (lane_x["cashier"], 1548)]},
        {"from": (lane_x["cashier"]+74, 1570), "to": (lane_x["pharmacy"]-45, 1570)},
        {"from": (lane_x["pharmacy"], 1593), "to": (lane_x["pharmacy"], 1618), "label": "[Có thuốc]", "color": "#7c3aed"},
        {"from": (lane_x["pharmacy"]-74, 1640), "to": (lane_x["patient"]+74, 1640)},
        {"from": (lane_x["pharmacy"]+45, 1570), "to": (lane_x["patient"]+74, 1640), "label": "[Không thuốc]", "color": "#64748b", "points": [(lane_x["pharmacy"]+60, 1570), (lane_x["pharmacy"]+60, 1680), (lane_x["patient"]+50, 1680), (lane_x["patient"], 1662)]},
        {"from": (lane_x["patient"], 1662), "to": (lane_x["patient"], 1695)}
    ]

    generate_swimlane_svg("LƯU ĐỒ QUY TRÌNH KHÁM NGOẠI TRÚ TÁI KHÁM (SWIMLANE ACTIVITY DIAGRAM)", nodes_2, connections_2, "docs/diagrams/Quy_Trinh_Kham_Ngoai_Tru_Tai_Kham_Swimlane.svg")
