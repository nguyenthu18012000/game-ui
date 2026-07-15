# Hệ Thống Bản Đồ Treasure Hunter

## Tổng Quan

Bản đồ game được chia thành lưới **400x400 ô** (24000x24000 đơn vị pixel, mỗi ô **60x60 pixels**).

**Tổng số ô**: 160,000 tiles
**Diện tích map**: Gấp 100 lần so với version trước

## Các Loại Ô Đất

| Loại             | Màu     | Phần Trăm | Tài Nguyên |
| ---------------- | ------- | --------- | ---------- |
| ⬜ Trống (Empty) | Xám tối | 30%       | 0          |
| 🌾 Cỏ (Grass)    | Xanh lá | 35%       | 10-30      |
| 🟫 Đất (Land)    | Nâu     | 20%       | 30-80      |
| ⬜ Đá (Rock)     | Xám     | 15%       | 50-150     |

## Cấu Trúc File

```
src/
├── types/
│   └── Tile.ts (định nghĩa kiểu dữ liệu Tile)
├── services/
│   ├── TileMapService.ts (tạo & quản lý bản đồ)
│   ├── TileMapRenderer.ts (vẽ bản đồ trên Phaser)
│   └── TileMapExample.ts (ví dụ sử dụng)
```

## Hướng Dẫn Sử Dụng

### 1. Tạo Bản Đồ Mới

```typescript
import { TileMapService } from "../services/TileMapService";

const tileMap = TileMapService.generateMap();
// Returns: TileMap {
//   width: 40,
//   height: 40,
//   tileSize: 10,
//   tiles: Tile[][]
// }
```

### 2. Render Bản Đồ Trong Scene

```typescript
import { TileMapRenderer } from "../services/TileMapRenderer";

const renderer = new TileMapRenderer(this); // 'this' là Phaser.Scene
renderer.renderMap(tileMap);
```

### 3. Lấy Tile Theo Tọa Độ Lưới (Grid)

```typescript
// Lấy tile tại ô (5, 10)
const tile = TileMapService.getTile(tileMap, 5, 10);
// {
//   x: 5, y: 10,
//   pixelX: 50, pixelY: 100,
//   type: "grass",
//   resourceAmount: 25,
//   isExplored: false
// }
```

### 4. Lấy Tile Theo Tọa Độ Pixel (Khi Click)

```typescript
// Khi người chơi click chuột tại pixel (123, 456)
const tile = TileMapService.getTileByPixel(tileMap, 123, 456);
if (tile) {
  console.log(`Clicked tile at grid (${tile.x}, ${tile.y})`);
}
```

### 5. Đào Tài Nguyên Từ Ô

```typescript
// Đào ô tại (5, 10) - mỗi lần đào lấy tối đa 10 tài nguyên
const resourceMined = TileMapService.mineTile(tileMap, 5, 10);
console.log(`Mined ${resourceMined} resources`);
```

### 6. Xem Thống Kê Bản Đồ

```typescript
const stats = TileMapService.getMapStats(tileMap);
// {
//   grassCount: 800,
//   landCount: 480,
//   rockCount: 320,
//   totalResources: 28950
// }
```

## Ví Dụ Hoàn Chỉnh - Tích Hợp Vào GameScene

```typescript
import { Scene } from "phaser";
import { TileMapService } from "../services/TileMapService";
import { TileMapRenderer } from "../services/TileMapRenderer";
import { TileMap } from "../types/Tile";

export class GameScene extends Scene {
  private tileMap!: TileMap;
  private tileMapRenderer!: TileMapRenderer;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    // 1. Tạo bản đồ
    this.tileMap = TileMapService.generateMap();

    // 2. Render bản đồ
    this.tileMapRenderer = new TileMapRenderer(this);
    this.tileMapRenderer.renderMap(this.tileMap);

    // 3. In thống kê
    const stats = TileMapService.getMapStats(this.tileMap);
    console.log("Map Statistics:", stats);

    // 4. Setup click để đào tài nguyên
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleTileClick(pointer);
    });
  }

  private handleTileClick(pointer: Phaser.Input.Pointer) {
    // Lấy tile tại vị trí click
    const tile = TileMapService.getTileByPixel(this.tileMap, pointer.x, pointer.y);

    if (!tile) return;

    // Đào tài nguyên
    const mined = TileMapService.mineTile(this.tileMap, tile.x, tile.y);
    console.log(`Mined ${mined} resources from ${tile.type}!`);

    // Cập nhật visual
    this.tileMapRenderer.updateTileVisual(tile.x, tile.y);
  }
}
```

## Tọa Độ - Chuyển Đổi

```typescript
// Grid Coordinates → Pixel Coordinates
const gridX = 50,
  gridY = 100;
const pixelX = gridX * 60; // 3000
const pixelY = gridY * 60; // 6000

// Pixel Coordinates → Grid Coordinates
const px = 3000,
  py = 6000;
const gx = Math.floor(px / 60); // 50
const gy = Math.floor(py / 60); // 100

// Map bounds
// Min: (0, 0)
// Max: (399, 399) in grid coords
// Max: (23940, 23940) in pixel coords
```

## Kế Tiếp (Tùy Chọn)

- Thêm animation khi đào ô
- Thêm particle effects cho tài nguyên
- Thêm âm thanh khi đào
- Lưu trạng thái bản đồ lên server
- Thêm các loại ô đặc biệt (kho báu, cạm bẫy, v.v.)
