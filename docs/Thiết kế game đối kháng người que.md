# Thiết kế game đối kháng người que

Nov 7, 2026 · @hao nguyen

## 1. Tổng quan

Game đối kháng 2D chạy trên trình duyệt, nhân vật người que dựng bằng bộ xương khớp vẽ hoàn toàn bằng code. Lối chơi lấy cảm hứng từ các game đối kháng Flash thời 2010: đánh tay đôi, bay lượn, nạp khí, bắn chưởng, tuyệt chiêu tia năng lượng và biến hình tăng sức mạnh.

Tài liệu này vừa là bản thiết kế để tự code, vừa có thể đưa cho coding agent làm đặc tả.

**Ràng buộc bản quyền (bắt buộc):** toàn bộ nhân vật, tên gọi, chiêu thức, hình ảnh và âm thanh là nguyên bản. Không dùng hay mô phỏng nhân vật, tên, kiểu tóc, trang phục, tên chiêu hoặc yếu tố nhận diện nào của Dragon Ball hay IP khác. Chỉ lối chơi được lấy cảm hứng.

## 2. Công nghệ

Chốt: Phaser 3 + TypeScript + Vite, không framework UI, không backend, không asset bên ngoài.

| Hạng mục | Lựa chọn | Lý do |
| --- | --- | --- |
| Engine | Phaser 3, bản ổn định mới nhất, pin version | Nhẹ, chạy web mượt, gần tinh thần game Flash |
| Ngôn ngữ | TypeScript, bật `strict` | Bắt lỗi sớm, dữ liệu chiêu thức có kiểu rõ ràng |
| Build | Vite | Khởi động nhanh, có template Phaser chính thức |
| UI | Scene của Phaser, không React/Next.js | Mọi thứ vẽ trên canvas, framework không giúp gì thêm |
| State | `scene data` + `this.registry` | Đủ cho dữ liệu trước trận và cài đặt, không cần Redux |
| Backend | Không có | Logic chạy hoàn toàn trên trình duyệt |
| Test | Vitest | Test phần logic lõi |
| Chất lượng code | ESLint + Prettier | Thống nhất phong cách |
| Hình ảnh | `Graphics` + `generateTexture()` | Không cần file ảnh |
| Âm thanh | Web Audio API tổng hợp | Không cần file âm thanh |
| Lưu trữ | `localStorage` bọc try/catch | Lưu cài đặt và phím bấm |
| Deploy | GitHub Pages, Netlify hoặc itch.io | Build ra file tĩnh |

Khởi tạo nhanh: `npm create @phaserjs/game@latest`, chọn template Vite + TypeScript.

Nếu sau này cần bảng xếp hạng thì thêm Supabase hoặc Firebase. Chơi online thì cần server WebSocket riêng (ví dụ Colyseus) và rollback netcode, đây là một dự án khác.

## 3. Kiến trúc

Nguyên tắc quan trọng nhất: logic game tách hẳn khỏi phần hiển thị và chạy theo tick cố định 60 lần mỗi giây.

### 3.1. Tách logic và hiển thị

- `src/core/` chứa toàn bộ logic, TypeScript thuần, **không import Phaser**.
- `src/render/` và `src/scenes/` chỉ đọc state từ core rồi vẽ ra, không bao giờ sửa state.
- Lợi ích: test được bằng Vitest, chạy tất định, sau này đồng bộ online không phải viết lại.

### 3.2. Vòng lặp tick cố định

Logic chạy 60 tick/giây bằng accumulator, tách khỏi tốc độ render. Hàm lõi có dạng `step(state, inputP1, inputP2) => state`. Input mỗi tick là bitmask gồm: trái, phải, lên, xuống, đánh nhẹ, đánh mạnh, chưởng, nạp khí/đỡ, bay.

Không gọi `Math.random()` trực tiếp. Cần ngẫu nhiên thì dùng PRNG có seed nằm trong state.

Thứ tự xử lý trong một tick:

1. Đọc input, đưa vào input buffer
2. Cập nhật state machine của hai nhân vật
3. Di chuyển, trọng lực, giới hạn sân, đẩy thân người
4. Cập nhật projectile
5. Kiểm tra trúng đòn cho cả hai bên đồng thời
6. Áp dụng hitstop, sát thương, knockback
7. Kiểm tra kết thúc round

### 3.3. Cấu trúc thư mục

```
src/
  core/
    types.ts            // kiểu dữ liệu chung
    loop.ts             // step(), fixed tick
    input.ts            // bitmask, input buffer
    fighter.ts          // state machine nhân vật
    physics.ts          // trọng lực, giới hạn sân, đẩy thân
    combat.ts           // hitbox/hurtbox, sát thương, combo
    projectile.ts       // chưởng, tia năng lượng
    skeleton.ts         // forward kinematics, nội suy pose
    ai.ts               // AI đối thủ
    match.ts            // round, thời gian, thắng thua
    config.ts           // hằng số
    data/
      characters/       // chỉ số, xương, bảng màu, phụ kiện
      moves/            // frame data từng chiêu
  render/
    fighterRenderer.ts  // dựng sprite bộ phận theo khớp
    partTextures.ts     // vẽ bộ phận bằng Graphics -> texture
    effects.ts          // hitspark, hào quang, vệt, particle
    hud.ts
    debug.ts            // vẽ hitbox/hurtbox/khớp
  audio/
    sfx.ts              // tổng hợp âm thanh Web Audio
  scenes/
    BootScene.ts
    MenuScene.ts
    CharacterSelectScene.ts
    BattleScene.ts
    PauseScene.ts
    ResultScene.ts
  main.ts
tests/
```

### 3.4. Quản lý state

| Loại state | Ví dụ | Nơi lưu |
| --- | --- | --- |
| Trước trận | Nhân vật đã chọn, chế độ, độ khó | Truyền qua `this.scene.start('Battle', data)` |
| Dùng chung | Âm lượng, phím bấm, bật debug | `this.registry` + `localStorage` |
| Trong trận | Máu, khí, vị trí, trạng thái | Chỉ trong core, không đưa vào registry |

## 4. Nhân vật khớp xương

Mỗi nhân vật là một bộ xương có khớp. Animation là góc xoay của các khớp theo thời gian, vị trí khớp tính bằng forward kinematics, hình ảnh vẽ bằng code.

### 4.1. Bộ xương

- Gốc: hông. Gốc tọa độ nhân vật đặt giữa hai chân, tại mặt đất.
- Chuỗi khớp: hông → thân → cổ/đầu; vai → khuỷu → nắm đấm (tay trước, tay sau); hông → gối → bàn chân (chân trước, chân sau).
- Chiều dài và độ dày từng đoạn khai báo trong dữ liệu nhân vật.

### 4.2. Pose và animation

- Một **pose** là bộ góc xoay của mọi khớp, tính cho nhân vật quay mặt sang phải.
- Một animation là danh sách keyframe, mỗi keyframe gồm pose và số tick kéo dài.
- Giữa các keyframe nội suy góc, có hỗ trợ easing.
- Quay sang trái thì lật theo trục x khi tính tọa độ thế giới.
- **Animation chạy theo tick logic**, không theo thời gian render.

```ts
type Pose = {
  torso: number;
  armFrontUpper: number; armFrontLower: number;
  armBackUpper: number;  armBackLower: number;
  legFrontUpper: number; legFrontLower: number;
  legBackUpper: number;  legBackLower: number;
};

type Keyframe = { pose: Pose; ticks: number; ease?: 'linear' | 'easeOut' | 'easeIn' };

function limb(origin: Vec2, angleDeg: number, length: number): Vec2 {
  const a = angleDeg * Math.PI / 180;
  return { x: origin.x + Math.cos(a) * length, y: origin.y + Math.sin(a) * length };
}
```

### 4.3. Hiển thị

Cách làm: vẽ mỗi bộ phận **một lần** bằng `Graphics` lúc khởi động rồi gọi `generateTexture()`. Khi chơi, mỗi bộ phận là một `Sprite` được đặt vị trí và góc xoay theo khớp, không vẽ lại `Graphics` mỗi frame. Cách này nhẹ, cạnh mượt, và sau này thay bằng hình vẽ tay chỉ cần đổi texture.

- Thân hình thang, tay chân hình con nhộng, đầu hình tròn.
- Viền tối dày, hai tông sáng/tối mỗi khối.
- Thứ tự vẽ: tay chân phía sau → thân → đầu → tay chân phía trước.
- Khi biến hình: đổi bảng màu bằng texture thứ hai hoặc `setTint`.

Cách đơn giản hơn để bắt đầu: vẽ lại bằng `Graphics` mỗi frame. Với 2 nhân vật vẫn chạy tốt, có thể chuyển sang texture sau.

## 5. Hệ thống chiến đấu

Đòn đánh không dùng hệ vật lý của Phaser. Hitbox và hurtbox định nghĩa bằng dữ liệu, kiểm tra AABB mỗi tick.

### 5.1. Hitbox và hurtbox

- **Hurtbox** tự sinh từ các đoạn xương (mỗi đoạn một hình chữ nhật bao quanh), nên luôn khớp hình vẽ.
- **Hitbox** khai báo trong frame data, **gắn vào một khớp** (nắm đấm trước, bàn chân trước…) kèm offset và kích thước, chỉ tồn tại trong các tick active.
- Mỗi lần ra chiêu trúng một mục tiêu tối đa một lần, trừ chiêu nhiều hit có khai báo riêng.
- Debug overlay: hurtbox xanh lá, hitbox đỏ, khớp chấm trắng.

### 5.2. Frame data

```ts
type HitboxDef = {
  joint: JointName;          // 'fistFront' | 'footFront' | ...
  offset: Vec2; w: number; h: number;
  fromTick: number; toTick: number;
};

type MoveData = {
  id: string;
  startup: number; active: number; recovery: number;
  keyframes: Keyframe[];
  hitboxes: HitboxDef[];
  damage: number; chipDamage: number;
  hitstun: number; blockstun: number; hitstop: number;
  knockback: Vec2;
  onHit?: 'launch' | 'knockdown';
  kiGain: number; kiCost?: number;
  cancelInto?: string[];     // chiêu có thể nối combo
  armor?: number;            // số hit chịu được không bị ngắt
};
```

Toàn bộ chiêu nằm trong file dữ liệu. Thêm chiêu mới không sửa code lõi.

### 5.3. Quy tắc

| Quy tắc | Giá trị khởi đầu |
| --- | --- |
| Hitstop khi trúng | 3–8 tick theo độ mạnh chiêu, cả hai bên đóng băng |
| Combo scaling | Mỗi hit sau giảm 10%, tối thiểu 30% |
| Đỡ đòn | Giữ nút đỡ khi đứng yên hoặc đi lùi; nhận blockstun và chipDamage |
| Input buffer | 6 tick |
| Hướng | Tiến/lùi tính theo hướng nhân vật đang nhìn |
| Quay mặt | Tự quay về phía đối thủ khi không tấn công hay bị đánh |
| Thân người | Không đi xuyên nhau, tự đẩy ra |
| Sân | Giới hạn hai bên và trần; camera bám giữa hai nhân vật |
| Trúng đồng thời | Hai bên cùng nhận đòn (trade) |

```ts
function checkHits(attacker: Fighter, defender: Fighter) {
  if (attacker.hitThisMove.has(defender.id)) return;
  for (const hb of activeHitboxes(attacker)) {
    for (const hu of hurtboxes(defender)) {
      if (aabbOverlap(hb, hu)) {
        attacker.hitThisMove.add(defender.id);
        applyHit(attacker, defender);
        return;
      }
    }
  }
}
```

## 6. State machine nhân vật

Mỗi nhân vật luôn ở đúng một trạng thái. Mọi nhánh cuối cùng quay về `idle`; trúng đòn từ bất kỳ trạng thái nào đều đưa vào nhóm Bị đánh, trừ khi chiêu đang có giáp.

&#91;embedded content: state machine nhân vật · 5 nhóm, 18 trạng thái\]

Sơ đồ vẽ theo nhóm; chuyển đổi chi tiết nằm trong bảng dưới. Sau khi thắng round, nhân vật chuyển sang `victory`.

| Từ | Sang | Điều kiện |
| --- | --- | --- |
| idle, walk | dash | Nhấn tiến hai lần nhanh |
| idle, walk | guard | Giữ đỡ khi đối thủ đang tấn công |
| idle | charge | Giữ nạp khí khi không bị đe dọa |
| Mặt đất | jump / fly | Nhấn nhảy / nhấn bay khi còn khí |
| jump | fall | Vận tốc y đổi chiều |
| fly | fall | Tắt bay hoặc hết khí |
| fall | idle | Chạm đất |
| Mặt đất, Trên không | attack, kiBlast, beam, transform | Bấm nút tương ứng, đủ khí |
| attack | attack | Trong cửa sổ `cancelInto` để nối combo |
| Ra chiêu | idle / fall | Hết recovery |
| Bất kỳ (trừ ko) | hitstun / launched / knockdown | Bị trúng, theo `onHit` của chiêu |
| guard | blockstun | Bị trúng khi đang đỡ |
| hitstun, blockstun | idle | Hết số tick stun |
| launched | knockdown | Chạm đất |
| knockdown | getup | Hết thời gian nằm |
| getup | idle | Hết hoạt ảnh, bất tử vài tick |
| Bất kỳ | ko | Máu về 0 |

```ts
interface FighterState {
  name: StateName;
  enter(f: Fighter): void;
  tick(f: Fighter, input: InputBits): StateName | null; // trả về trạng thái kế tiếp nếu chuyển
  exit(f: Fighter): void;
}
```

## 7. Tài nguyên và cơ chế đặc trưng

Máu mặc định 1000, khí từ 0 đến 300 chia 3 vạch. Khí là tài nguyên trung tâm: dùng để bay, bắn chưởng, tung tuyệt chiêu và biến hình.

| Cơ chế | Kích hoạt | Chi phí khí | Quy tắc chính |
| --- | --- | --- | --- |
| Nạp khí | Giữ nút nạp khí khi đứng yên | Tăng \~2/tick | Đứng yên nên dễ bị đánh; có hào quang |
| Bay | Nhấn nút bay để bật/tắt | Tiêu hao chậm liên tục | Không trọng lực, đi 8 hướng chậm hơn chạy; hết khí thì rơi |
| Chưởng | Nút chưởng | 20 | Bay thẳng; giới hạn số chưởng cùng lúc; hai chưởng va nhau thì triệt tiêu |
| Tia năng lượng | Xuống + chưởng | 100 | Gồng lâu rồi bắn tia dài nhiều hit; hai tia va nhau thì đấu sức bằng cách bấm liên tục |
| Biến hình | Nạp khí + đánh mạnh khi đầy 300 | Giảm dần khi duy trì | +25% sát thương, +15% tốc độ; hết khí thì trở lại thường |

Khí còn tăng khi đánh trúng (theo `kiGain` của chiêu) và khi bị đánh trúng, giúp bên yếu thế có cơ hội lật ngược.

Tất cả con số trên chỉ là điểm khởi đầu, cần chỉnh khi chơi thử.

## 8. Nhân vật và cách phân biệt

Ba nhân vật nguyên bản, mỗi người một lối chơi, phân biệt được ngay từ hình bóng.

| Nhân vật | Lối chơi | Máu | Tốc độ | Hình bóng | Màu năng lượng | Tuyệt chiêu riêng |
| --- | --- | --- | --- | --- | --- | --- |
| Hỏa Quyền | Cân bằng | 1000 | Trung bình | Tỉ lệ chuẩn | Đỏ/cam | Tia lửa xoắn ốc |
| Phong Ảnh | Nhanh, combo dài, dash xa | 850 | Nhanh | Mảnh, chân dài, đổ người về trước | Xanh lam ngọc | Lướt chém liên hoàn xuyên qua đối thủ |
| Thiết Giáp | Chậm, đòn mạnh có giáp 1 hit | 1200 | Chậm | Vai rộng, tay to, chân ngắn, đầu nhỏ | Xám/tím | Nện đất tạo sóng chấn động |

Mỗi nhân vật tối thiểu có: chuỗi 3 đòn nhẹ, 2 đòn mạnh (1 launcher, 1 knockdown), 1 đòn trên không, chưởng, tia năng lượng (biến thể riêng) và biến hình.

### 8.1. Phân biệt nhân vật (theo thứ tự ưu tiên)

1. **Hình bóng:** tỉ lệ xương và độ dày khối. Tô đen hết vẫn phải nhận ra ai.
2. **Bảng màu:** màu chính, màu phụ, màu năng lượng. Màu năng lượng dùng chung cho hào quang và mọi chiêu.
3. **Phụ kiện gắn khớp:** băng đô, khăn quàng, giáp vai, găng tay to, đai lưng, áo choàng, khai báo bằng dữ liệu.
4. **Chuyển động thứ cấp:** khăn, đuôi băng đô, vạt áo mô phỏng bằng verlet, bay theo khi dash hay bị đánh.
5. **Pose đứng chờ:** Hỏa Quyền nhún nhảy kiểu quyền anh, Phong Ảnh khom thấp đung đưa, Thiết Giáp đứng vững thở chậm.
6. **Mắt tối giản:** đổi biểu cảm khi bị đánh hoặc tung tuyệt chiêu.

```ts
accessories: [
  { joint: 'head',      shape: 'headband', color: 0xffffff, tails: true },
  { joint: 'fistFront', shape: 'gauntlet', scale: 1.4, color: 0x666677 },
  { joint: 'shoulder',  shape: 'pauldron', side: 'both', color: 0x554466 },
]
```

### 8.2. Phân biệt chiêu thức

Mỗi nhân vật có một ngôn ngữ hình khối riêng cho năng lượng:

- **Hỏa Quyền:** hình tròn, xoắn ốc, ngọn lửa lượn sóng.
- **Phong Ảnh:** đường chéo sắc, vệt chém mảnh, tia nhỏ.
- **Thiết Giáp:** khối vuông, vết nứt, sóng chấn động lan trên mặt đất.

Một hiệu ứng chiêu gồm nhiều lớp: lõi sáng gần trắng, vầng màu năng lượng (blend ADD), particle theo đường bay, hiệu ứng va chạm riêng và âm thanh riêng. Chiêu mạnh cần lấy đà dễ đọc (tư thế gồng, hào quang tụ lại, màn hình tối một nhịp) để đối thủ kịp phản ứng.

## 9. Điều khiển và chế độ chơi

Hai người chơi chung một bàn phím, có hỗ trợ gamepad và đổi phím trong cài đặt.

| Hành động | P1 | P2 |
| --- | --- | --- |
| Di chuyển trái/phải | A / D | ← / → |
| Nhảy / lên khi bay | W | ↑ |
| Xuống | S | ↓ |
| Đánh nhẹ | J | Numpad 1 |
| Đánh mạnh | K | Numpad 2 |
| Chưởng | L | Numpad 3 |
| Nạp khí / đỡ | I | Numpad 5 |
| Bay (bật/tắt) | U | Numpad 4 |
| Tia năng lượng | S + L | ↓ + Numpad 3 |
| Biến hình (khi đầy khí) | I + K | Numpad 5 + Numpad 2 |

Gamepad dùng Gamepad API của Phaser. Phím đã đổi lưu vào `localStorage`.

### Chế độ chơi

- **1P vs Máy:** 3 độ khó.
- **2P cùng máy.**
- **Luyện tập:** đối thủ đứng yên hoặc tự đỡ, tùy chọn khí vô hạn, hiển thị frame data.

Trận đấu thắng 2 trong 3 round, mỗi round 99 giây. Hết giờ thì ai còn nhiều phần trăm máu hơn thắng.

## 10. AI đối thủ

AI là một state machine trong `core/ai.ts`, sinh ra input bitmask giống hệt người chơi và không được đọc thông tin mà người chơi không thấy.

Các hành vi: tiếp cận, giữ khoảng cách để bắn chưởng, đỡ đòn, phản công sau khi đỡ, nạp khí khi ở xa, dùng tuyệt chiêu khi đủ khí, biến hình khi đầy khí.

| Độ khó | Độ trễ phản xạ | Xác suất đỡ | Combo tối đa |
| --- | --- | --- | --- |
| Dễ | \~30 tick | 20% | 2 hit |
| Vừa | \~15 tick | 50% | 4 hit |
| Khó | \~6 tick | 80% | Không giới hạn |

Độ trễ phản xạ thực hiện bằng cách cho AI nhìn state của vài tick trước, không phải state hiện tại.

## 11. Hiệu ứng, HUD, âm thanh

Cảm giác đánh quan trọng hơn hình vẽ đẹp: hitstop, rung màn hình và hitspark là ba thứ cần có sớm nhất.

### 11.1. Hiệu ứng

- **Lấy đà:** trước cú đánh, tay chân rút về một chút rồi vung nhanh.
- **Hitspark** tại điểm trúng, khác nhau giữa đòn nhẹ, đòn mạnh và bị đỡ.
- **Rung màn hình** khi trúng đòn mạnh và tuyệt chiêu (`cameras.main.shake`).
- **Vệt chuyển động** theo quỹ đạo nắm đấm/bàn chân trong tick active.
- **Bóng mờ** khi dash.
- **Hào quang** khi nạp khí và khi biến hình, blend mode ADD.
- **Particle** khi bắn chưởng, chưởng nổ, tiếp đất mạnh.
- Nhân vật bị trúng nhấp nháy trắng ngắn.
- Nền tối vẽ procedural (gradient trời, núi, mặt đất), parallax nhẹ.

### 11.2. HUD

- Thanh máu hai bên, có phần đỏ trễ hiện lượng vừa mất rồi rút dần.
- Thanh khí 3 vạch dưới thanh máu.
- Đồng hồ ở giữa, biểu tượng round đã thắng.
- Bộ đếm combo từ 2 hit trở lên.
- Chữ thông báo: "Round 1", "Fight!", "K.O.", "Time Up".

### 11.3. Âm thanh

Tổng hợp bằng Web Audio API (oscillator + noise + envelope), không dùng file: đấm nhẹ, đấm mạnh, đỡ, bắn chưởng, nổ, gồng, tia năng lượng, biến hình, K.O. Âm thanh mỗi nhân vật có cao độ riêng: Thiết Giáp trầm, Phong Ảnh cao và sắc. Có thanh âm lượng trong cài đặt.

## 12. Debug và chất lượng

Làm debug overlay ngay từ khi có bộ xương đầu tiên, nó tiết kiệm hàng giờ đoán mò.

| Phím | Chức năng |
| --- | --- |
| F1 | Bật/tắt hitbox (đỏ), hurtbox (xanh lá), khớp xương |
| F2 | Tạm dừng |
| F3 | Tua từng tick khi đang dừng |
| F4 | Hiện state, stateFrame, máu, khí từng nhân vật |
| F5 | Hiện FPS và tick rate |

### Yêu cầu chất lượng

- Unit test cho: nội suy pose, forward kinematics (kể cả khi lật hướng), va chạm AABB, combo scaling, chuyển trạng thái.
- Test tính tất định: cùng chuỗi input phải cho cùng kết quả sau N tick.
- Giữ 60 FPS ổn định trên laptop phổ thông.
- Không có magic number rải rác, hằng số gom về `core/config.ts`.
- Không lỗi TypeScript, ESLint sạch trước mỗi commit.

## 13. Lộ trình tự code

Đi theo 12 bước nhỏ, mỗi bước chạy được và commit Git trước khi sang bước sau. Bước 6 là cột mốc quan trọng nhất: cú đấm đầu tiên trúng đúng frame.

- [ ] **Bước 1 – Làm quen Phaser.** Khởi tạo project, vẽ hình bằng `Graphics`, cho một ô vuông đi, nhảy, rơi xuống đất.
- [ ] **Bước 2 – Tick cố định.** Tách logic khỏi `update()`, chạy accumulator 60 tick/giây, input dạng bitmask.
- [ ] **Bước 3 – Một cánh tay.** Hai đoạn xương vai → khuỷu → nắm đấm, chỉnh góc bằng phím. Làm debug overlay luôn.
- [ ] **Bước 4 – Cả bộ xương.** Toàn thân, nội suy pose, animation đứng chờ và đi bộ, lật hướng.
- [ ] **Bước 5 – State machine.** Đứng, đi, nhảy, rơi với `enter`, `tick`, `exit`.
- [ ] **Bước 6 – Cú đấm trúng bao cát.** Frame data, hitbox gắn nắm đấm, hurtbox từ xương; đối thủ là hình chữ nhật đứng yên.
- [ ] **Bước 7 – Cảm giác đánh.** Hitstop, hitstun, knockback, rung màn hình, hitspark. Chơi thử và chỉnh số.
- [ ] **Bước 8 – Hai nhân vật thật.** Đỡ đòn, combo, input buffer, quay mặt, đẩy thân người.
- [ ] **Bước 9 – Khí và chưởng.** Thanh khí, nạp khí, chưởng, launcher, knockdown, getup.
- [ ] **Bước 10 – Cơ chế đặc trưng.** Bay, tia năng lượng, đấu tia, biến hình.
- [ ] **Bước 11 – Nội dung.** Ba nhân vật, phụ kiện, verlet, AI ba độ khó, chế độ luyện tập.
- [ ] **Bước 12 – Hoàn thiện.** Menu, chọn nhân vật, round, HUD, hiệu ứng, âm thanh, cài đặt phím, deploy.

Nếu giao cho agent, gộp thành 6 mốc: M1 = bước 1–4, M2 = 5–8, M3 = 9, M4 = 10, M5 = 11, M6 = 12. Yêu cầu agent báo cáo và chạy test sau mỗi mốc.

## 14. Tài liệu tham khảo và lời khuyên

Tên tài liệu để tìm đọc (chưa kèm link, tìm theo tên là ra):

| Tài liệu | Đọc để hiểu | Dùng ở bước |
| --- | --- | --- |
| Phaser Examples và tài liệu API Phaser 3 | Scene, Graphics, input, camera, particle | 1, 3, 7 |
| *Game Programming Patterns* – Robert Nystrom (đọc miễn phí trên web) | Game Loop, State, Update Method, Object Pool | 2, 5, 9 |
| "Fix Your Timestep!" – Glenn Fiedler | Vòng lặp tick cố định | 2 |
| Wiki frame data của cộng đồng game đối kháng | Startup, active, recovery, frame advantage | 6, 8 |
| Bài viết về Verlet integration cho dây/vải | Khăn quàng, đuôi băng đô bay | 11 |

### Lời khuyên

- Commit Git sau mỗi bước chạy được.
- Đừng đánh bóng hình ảnh khi chưa có cú đấm đầu tiên trúng đích.
- Người que xấu mà đánh sướng vẫn hơn người que đẹp mà đánh không cảm giác.
- Kẹt thì nhờ giải thích hoặc review code thay vì viết hộ, vẫn là tự code mà đỡ mất thời gian.

## 15. Ngoài phạm vi

Không làm trong phiên bản này: chơi online, tài khoản, bảng xếp hạng, backend, bản mobile cảm ứng, và bất kỳ nội dung nào thuộc IP có bản quyền.
