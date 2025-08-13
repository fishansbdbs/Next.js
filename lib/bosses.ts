diff --git a//dev/null b/lib/bosses.ts
index 0000000000000000000000000000000000000000..bc8bd81451464afbf4c49defea0478f481fdd9d9 100644
--- a//dev/null
+++ b/lib/bosses.ts
@@ -0,0 +1,46 @@
+export type BossInfo = {
+  id: number
+  name: string
+  health: number
+  attack: number
+  lore: string
+}
+
+export const bosses: BossInfo[] = [
+  {
+    id: 1,
+    name: 'Goblin King',
+    health: 120,
+    attack: 8,
+    lore:
+      'The cunning Goblin King rules the underways, promising his horde endless plunder.',
+  },
+  {
+    id: 2,
+    name: 'Dragon Mage',
+    health: 150,
+    attack: 10,
+    lore: 'A draconic warlock seeking to ignite the world in arcane flame.',
+  },
+  {
+    id: 3,
+    name: 'Dark Knight',
+    health: 170,
+    attack: 12,
+    lore: 'Once a noble guardian, the Dark Knight now serves a twisted power.',
+  },
+  {
+    id: 4,
+    name: 'King Fish',
+    health: 200,
+    attack: 14,
+    lore: 'From the abyssal depths, the King Fish hoards relics and treasures.',
+  },
+  {
+    id: 5,
+    name: 'Lich Lord',
+    health: 220,
+    attack: 16,
+    lore: 'A master of undeath who hungers for eternal dominion.',
+  },
+]
