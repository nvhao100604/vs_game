# Stickman Fighting Game (Game Đối Kháng Người Que)

Game đối kháng 2D chạy trên trình duyệt lấy cảm hứng từ các tựa game Flash đối kháng kinh điển thời 2010: đánh tay đôi, bay lượn, nạp khí, bắn chưởng, tuyệt chiêu tia năng lượng và biến hình tăng sức mạnh. 

Nhân vật được dựng bằng khung xương khớp (skeletal animation) vẽ hoàn toàn bằng code, không phụ thuộc vào asset hình ảnh hay âm thanh bên ngoài.

---

## 🛠 Công nghệ sử dụng

- **Engine:** [Phaser 3](https://phaser.io/)
- **Ngôn ngữ:** TypeScript (bật chế độ `strict`)
- **Công cụ Build & Dev Server:** [Vite](https://vitejs.dev/)
- **Kiểm thử (Unit Tests):** Vitest (chuyên dụng kiểm thử logic lõi)
- **Đồ họa:** Vẽ bằng Phaser `Graphics` và sinh texture (`generateTexture()`) tại runtime.
- **Âm thanh:** Tổng hợp âm thanh thủ tục bằng Web Audio API.

---

## 🏗 Kiến trúc dự án

Dự án áp dụng nguyên tắc phân tách nghiêm ngặt giữa **Core Logic** và **Presentation / Rendering**:

1. **Deterministic Fixed Timestep:** Logic trận đấu chạy ở tần số cố định 60 tick/giây (`step(state, inputP1, inputP2) => state`), độc lập hoàn toàn với tốc độ khung hình (FPS) hiển thị.
2. **Core tách biệt engine:** Thư mục `src/core/` chứa toàn bộ mô hình dữ liệu, va chạm hitbox/hurtbox, state machine và forward kinematics. Core là TypeScript thuần và **không import Phaser**.
3. **Phần hiển thị thụ động:** `src/render/` và `src/scenes/` chỉ đọc snapshot trạng thái từ Core để vẽ lên màn hình, không trực tiếp thay đổi state logic.

---

## 📁 Cấu trúc thư mục

```
src/
  core/                  # Toàn bộ logic lõi (Pure TypeScript, không import Phaser)
    types.ts             # Kiểu dữ liệu chung và interface
    config.ts            # Hằng số và thông số gameplay
    loop.ts              # Vòng lặp tick cố định (fixed timestep)
    input.ts             # Quản lý input bitmask và buffer
    fighter.ts           # State machine nhân vật
    physics.ts           # Trọng lực, giới hạn sàn đấu, tách va chạm thân
    combat.ts            # Xử lý hitbox, hurtbox, sát thương, combo scaling
    projectile.ts        # Quản lý đạn năng lượng (ki blast) và tia beam
    skeleton.ts          # Forward kinematics, nội suy pose animation
    ai.ts                # AI đối thủ
    match.ts             # Quản lý round, thời gian, kết quả thắng thua
    rng.ts               # Bộ tạo số ngẫu nhiên tất định (PRNG có seed)
    data/
      characters/        # Chỉ số, cấu trúc xương, bảng màu nhân vật
      moves/             # Frame data chiêu thức
  render/                # Hiển thị & Renderer
    fighterRenderer.ts   # Dựng sprite bộ phận theo khớp xương
    partTextures.ts      # Khởi tạo texture bộ phận bằng Graphics
    effects.ts           # Hiệu ứng hitspark, aura, vệt tốc độ, particle
    hud.ts               # Giao diện thanh máu, nội năng, thời gian, combo
    debug.ts             # Overlay debug (hitbox, hurtbox, khớp xương)
  audio/
    sfx.ts               # Tổng hợp âm thanh thủ tục qua Web Audio API
  input/
    keyboard.ts          # Bắt phím bàn phím và ánh xạ sang bitmask
  scenes/                # Các Scene trong Phaser
    BootScene.ts         # Tiền tải tài nguyên & tạo texture
    MenuScene.ts         # Màn hình chính
    CharacterSelectScene.ts # Màn hình chọn nhân vật
    BattleScene.ts       # Sàn đấu chính
    PauseScene.ts        # Màn hình tạm dừng
    ResultScene.ts       # Màn hình kết quả
  main.ts                # Khởi tạo Phaser Game
tests/
  core/                  # Unit tests cho phần logic lõi
docs/
  Thiết kế game đối kháng người que.md # Tài liệu đặc tả thiết kế chi tiết
```

---

## 🚀 Cài đặt & Khởi chạy

### Yêu cầu
- [Node.js](https://nodejs.org/) (khuyến nghị phiên bản 18 trở lên)
- Trình quản lý gói `npm` (đi kèm Node.js)

### Cài đặt dependencies
```bash
npm install
```

### Chạy môi trường phát triển (Dev)
```bash
npm run dev
```

### Build sản phẩm (Production)
```bash
npm run build
```

---

## 📖 Tài liệu đặc tả

Xem toàn bộ thiết kế chi tiết về hệ thống chiến đấu, state machine, bộ xương và lộ trình phát triển tại [`docs/Thiết kế game đối kháng người que.md`](docs/Thiết%20kế%20game%20đối%20kháng%20người%20que.md).
