import type * as Phaser from "phaser";
import { ANIM_FRAME_COUNT, type PlayerAnimState } from "../entities/Player";
import type { EquipmentItem } from "../types/Equipment";

// Vite discovers all equipment PNGs at build time but imports them lazily.
// Adding a new equipment folder = zero code changes needed here.
const equipmentGlob = import.meta.glob<string>("../assets/equipment/**/*.png", {
  import: "default",
});

function globPath(folder: string, file: string): string {
  return `../assets/equipment/${folder}/${file}`;
}

async function resolveUrl(path: string): Promise<string | null> {
  const importer = equipmentGlob[path];
  if (!importer) return null;
  return importer();
}

export class AssetLoader {
  /**
   * Ensures all textures referenced in a remote PlayerAnimState are loaded.
   * Call this BEFORE player.applyAnimState(state) when handling network packets.
   *
   * Usage:
   *   socket.on('playerUpdate', async (state: PlayerAnimState) => {
   *     await AssetLoader.ensureLoadedForState(this.scene, state);
   *     remotePlayer.applyAnimState(state);
   *   });
   */
  static async ensureLoadedForState(scene: Phaser.Scene, state: PlayerAnimState): Promise<void> {
    const tasks: Promise<void>[] = [];

    if (state.bodyAssetFolder) {
      tasks.push(
        AssetLoader.ensureLoaded(scene, {
          slot: "body",
          spriteKey: state.bodyIdleKey,
          animPrefix: state.bodyAnimPrefix,
          assetFolder: state.bodyAssetFolder,
        } as EquipmentItem),
      );
    }

    if (state.legAssetFolder) {
      tasks.push(
        AssetLoader.ensureLoaded(scene, {
          slot: "legs",
          spriteKey: state.legIdleKey,
          animPrefix: state.legAnimPrefix,
          assetFolder: state.legAssetFolder,
        } as EquipmentItem),
      );
    }

    await Promise.all(tasks);
  }

  /**
   * Ensures all Phaser textures for one EquipmentItem are loaded.
   * - Idle sprite + walk animation frames (idle sprites/anims only; icons are preloaded).
   * - Safe to call many times — skips textures that already exist.
   * - Returns a Promise so you can await before using the textures.
   */
  static async ensureLoaded(scene: Phaser.Scene, item: EquipmentItem): Promise<void> {
    // Fast path: if the idle sprite texture is present, everything is ready.
    if (scene.textures.exists(item.spriteKey)) return;

    const folder = item.assetFolder;
    const partName = item.slot === "body" ? "body" : "leg";

    const toLoad: { key: string; path: string }[] = [
      { key: item.spriteKey, path: globPath(folder, `${partName}.png`) },
    ];

    for (let i = 1; i <= ANIM_FRAME_COUNT; i++) {
      toLoad.push({
        key: item.animPrefix + i,
        path: globPath(folder, `animation/anim_${partName}_${i}.png`),
      });
    }

    // Resolve all file URLs via dynamic import (Vite handles hashing/CDN paths).
    const resolved = (
      await Promise.all(
        toLoad.map(async (t) => {
          const url = await resolveUrl(t.path);
          return url ? { key: t.key, url } : null;
        }),
      )
    ).filter((r): r is { key: string; url: string } => r !== null);

    const missing = resolved.filter((r) => !scene.textures.exists(r.key));
    if (missing.length === 0) return;

    return new Promise<void>((resolve) => {
      missing.forEach((r) => scene.load.image(r.key, r.url));
      scene.load.once("complete", () => resolve());
      scene.load.start();
    });
  }
}
