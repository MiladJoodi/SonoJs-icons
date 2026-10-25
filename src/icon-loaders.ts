import {
  iconChunkMap as cryptoMap,
  loadIconChunk as loadCryptoChunk,
} from "./generated/crypto/loaders";
import {
  iconChunkMap as devMap,
  loadIconChunk as loadDevChunk,
} from "./generated/dev/loaders";
import {
  iconChunkMap as generalMap,
  loadIconChunk as loadGeneralChunk,
} from "./generated/general/loaders";
import type { IconGlyphData } from "./types";

type ChunkLoader = (
  chunkId: string,
) => Promise<{ data: Record<string, IconGlyphData> }>;

const packs: Array<{
  map: Record<string, string>;
  load: ChunkLoader;
}> = [
  { map: cryptoMap, load: loadCryptoChunk },
  { map: devMap, load: loadDevChunk },
  { map: generalMap, load: loadGeneralChunk },
];

/**
 * Resolve which pack chunk holds an icon id, then load only that small chunk.
 */
export async function loadIconChunkById(
  id: string,
): Promise<Record<string, IconGlyphData> | null> {
  for (const pack of packs) {
    const chunkId = pack.map[id];
    if (!chunkId) continue;
    const mod = await pack.load(chunkId);
    return mod.data;
  }
  return null;
}

/**
 * @deprecated Prefer loadIconChunkById — kept for API compatibility.
 */
export const categoryDataLoaders: Record<
  string,
  () => Promise<{ data: Record<string, IconGlyphData> }>
> = {};
