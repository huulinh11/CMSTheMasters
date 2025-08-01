export const TASKS_BY_ROLE: Record<string, string[]> = {
  // VIP Roles
  "Prime Speaker": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Vinh danh sân khấu", "Trao cúp khách mời", "Nghệ sĩ quay chụp booth", "Quay chụp thuyết trình", "Quay chụp trình diễn lần 1", "Quay chụp trình diễn lần 2", "Đi catwalk + cầm mic nói", "Nhận chứng nhận", "Nhận cúp"],
  "Guest Speaker": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Vinh danh sân khấu", "Trao cúp khách mời", "Nghệ sĩ chụp booth", "Quay chụp trình diễn lần 1", "Quay chụp trình diễn lần 2", "Đi catwalk + Cầm mic nói", "Nhận chứng nhận", "Nhận cúp"],
  "Mentor kiến tạo": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Vinh danh sân khấu", "Trao cúp khách mời", "Nhận chứng nhận", "Nhận cúp"],
  "Đại sứ": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Lễ trao sash", "Nhận cúp", "Trao cúp cho vai trò", "Trao cúp khách mời"],
  "Phó BTC": ["MC đọc thảm đỏ + quay", "Phỏng vấn", "Trao cúp cho khách mời"],
  "Cố vấn": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Vinh danh sân khấu", "Nhận cúp", "Trao cúp cho vai trò", "Trao cúp khách mời"],
  "Giám đốc": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Trao cúp cho khách mời"],
  "Nhà tài trợ": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Trao cúp cho vai trò", "Trao cúp cho khách mời", "Quay chụp booth", "Nghệ sĩ quay chụp booth"],
  // Regular Roles
  "Khách phổ thông": ["Checkin", "Nhận cúp trên sân khấu", "Nhận cúp", "Nhận chứng nhận"],
  "VIP": ["Checkin + Phiếu ăn", "Phỏng vấn", "Nhận cúp trên sân khấu", "Nhận cúp", "Nhận chứng nhận", "chụp ảnh AI"],
  "V-VIP": ["Checkin + Phiếu ăn", "MC đọc thảm đỏ + quay", "Phỏng vấn", "Nhận cúp trên sân khấu", "Nhận cúp", "Nhận chứng nhận", "chụp ảnh AI"],
  "Super Vip": ["Checkin + Phiếu ăn"],
  "Vé trải nghiệm": ["Checkin"],
};

export const ALL_TASKS = [...new Set(Object.values(TASKS_BY_ROLE).flat())];