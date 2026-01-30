import type { Achievement, AchievementCategory } from '@/types';

export const ACHIEVEMENTS: Achievement[] = [
  // Survival achievements
  {
    id: 'survive_night_1',
    nameKey: 'ach_survive_n1',
    descriptionKey: 'ach_survive_n1_desc',
    icon: '🌙',
    category: 'survival',
    points: 10,
    isSecret: false,
    requirements: { night: 1 },
  },
  {
    id: 'survive_night_2',
    nameKey: 'ach_survive_n2',
    descriptionKey: 'ach_survive_n2_desc',
    icon: '🌙',
    category: 'survival',
    points: 15,
    isSecret: false,
    requirements: { night: 2 },
  },
  {
    id: 'survive_night_3',
    nameKey: 'ach_survive_n3',
    descriptionKey: 'ach_survive_n3_desc',
    icon: '🌙',
    category: 'survival',
    points: 20,
    isSecret: false,
    requirements: { night: 3 },
  },
  {
    id: 'survive_night_4',
    nameKey: 'ach_survive_n4',
    descriptionKey: 'ach_survive_n4_desc',
    icon: '🌙',
    category: 'survival',
    points: 30,
    isSecret: false,
    requirements: { night: 4 },
  },
  {
    id: 'survive_night_5',
    nameKey: 'ach_survive_n5',
    descriptionKey: 'ach_survive_n5_desc',
    icon: '⭐',
    category: 'survival',
    points: 50,
    isSecret: false,
    requirements: { night: 5 },
  },
  {
    id: 'survive_night_6',
    nameKey: 'ach_survive_n6',
    descriptionKey: 'ach_survive_n6_desc',
    icon: '💀',
    category: 'survival',
    points: 75,
    isSecret: false,
    requirements: { night: 6 },
  },
  {
    id: 'survive_night_7_2020',
    nameKey: 'ach_2020_mode',
    descriptionKey: 'ach_2020_mode_desc',
    icon: '🏆',
    category: 'survival',
    points: 200,
    isSecret: false,
    requirements: { night: 7, custom: [20, 20, 20, 20] },
  },

  // Skills achievements
  {
    id: 'power_saver',
    nameKey: 'ach_power_saver',
    descriptionKey: 'ach_power_saver_desc',
    icon: '🔋',
    category: 'skills',
    points: 20,
    isSecret: false,
    requirements: { minPower: 50 },
  },
  {
    id: 'no_power_survive',
    nameKey: 'ach_no_power',
    descriptionKey: 'ach_no_power_desc',
    icon: '🌑',
    category: 'skills',
    points: 30,
    isSecret: true,
    requirements: { survivedPowerout: true },
  },
  {
    id: 'no_cameras',
    nameKey: 'ach_no_cameras',
    descriptionKey: 'ach_no_cameras_desc',
    icon: '📵',
    category: 'skills',
    points: 40,
    isSecret: false,
    requirements: { noCameras: true },
  },
  {
    id: 'speed_demon',
    nameKey: 'ach_speed_demon',
    descriptionKey: 'ach_speed_demon_desc',
    icon: '⚡',
    category: 'skills',
    points: 35,
    isSecret: false,
    requirements: { timeUnder: 300 },
  },
  {
    id: 'marathon',
    nameKey: 'ach_marathon',
    descriptionKey: 'ach_marathon_desc',
    icon: '🏃',
    category: 'survival',
    points: 60,
    isSecret: false,
    requirements: { survivalTime: 600 },
  },

  // Collectible achievements
  {
    id: 'first_pizza',
    nameKey: 'ach_first_pizza',
    descriptionKey: 'ach_first_pizza_desc',
    icon: '🍕',
    category: 'collectibles',
    points: 5,
    isSecret: false,
    requirements: { pizzaCount: 1 },
  },
  {
    id: 'pizza_master',
    nameKey: 'ach_pizza_master',
    descriptionKey: 'ach_pizza_master_desc',
    icon: '🍕',
    category: 'collectibles',
    points: 50,
    isSecret: false,
    requirements: { pizzaCount: 8 },
  },

  // Photo achievements
  {
    id: 'photographer',
    nameKey: 'ach_photographer',
    descriptionKey: 'ach_photographer_desc',
    icon: '📸',
    category: 'photos',
    points: 15,
    isSecret: false,
    requirements: { photos: 10 },
  },
  {
    id: 'rare_shot',
    nameKey: 'ach_rare_shot',
    descriptionKey: 'ach_rare_shot_desc',
    icon: '📷',
    category: 'photos',
    points: 75,
    isSecret: true,
    requirements: { photoGoldenFreddy: true },
  },

  // Secret achievements
  {
    id: 'golden_freddy_seen',
    nameKey: 'ach_golden',
    descriptionKey: 'ach_golden_desc',
    icon: '🐻',
    category: 'secrets',
    points: 100,
    isSecret: true,
    requirements: { goldenFreddy: true },
  },

  // Minigame achievements
  {
    id: 'all_minigames',
    nameKey: 'ach_arcade_master',
    descriptionKey: 'ach_arcade_master_desc',
    icon: '🕹️',
    category: 'minigames',
    points: 40,
    isSecret: false,
    requirements: { minigamesCompleted: 3 },
  },
];

// Localization strings (Dutch)
export const ACHIEVEMENT_STRINGS_NL: Record<string, { name: string; description: string }> = {
  'survive_night_1': { name: 'Eerste Nacht', description: 'Overleef Nacht 1' },
  'survive_night_2': { name: 'Tweede Nacht', description: 'Overleef Nacht 2' },
  'survive_night_3': { name: 'Derde Nacht', description: 'Overleef Nacht 3' },
  'survive_night_4': { name: 'Vierde Nacht', description: 'Overleef Nacht 4' },
  'survive_night_5': { name: 'Veteraan', description: 'Overleef Nacht 5' },
  'survive_night_6': { name: 'Nachtmerrie', description: 'Overleef Nacht 6' },
  'survive_night_7_2020': { name: '20/20/20/20 Mode', description: 'Voltooi Nacht 7 op maximale moeilijkheid' },
  'power_saver': { name: 'Energie Bespaarder', description: 'Eindig een nacht met 50% of meer stroom' },
  'no_power_survive': { name: 'Duisternis', description: 'Overleef zonder stroom' },
  'no_cameras': { name: 'Blind Spelen', description: 'Overleef een nacht zonder camera\'s te gebruiken' },
  'speed_demon': { name: 'Snelheidsduivel', description: 'Voltooi een nacht in minder dan 5 minuten' },
  'marathon': { name: 'Marathon Loper', description: 'Overleef 10 minuten in Survival Mode' },
  'first_pizza': { name: 'Pizza Vinder', description: 'Vind je eerste pizza slice' },
  'pizza_master': { name: 'Pizza Meester', description: 'Verzamel alle 8 pizza slices' },
  'photographer': { name: 'Fotograaf', description: 'Neem 10 foto\'s van animatronics' },
  'rare_shot': { name: 'Zeldzame Opname', description: 'Fotografeer Golden Freddy' },
  'golden_freddy_seen': { name: 'Het is mij', description: 'Ontmoet Golden Freddy' },
  'all_minigames': { name: 'Arcade Meester', description: 'Voltooi alle 3 mini-games' },
};

export function getAchievementString(id: string, lang: 'nl' | 'en' = 'nl'): { name: string; description: string } {
  if (lang === 'nl' && ACHIEVEMENT_STRINGS_NL[id]) {
    return ACHIEVEMENT_STRINGS_NL[id];
  }
  // Fallback to key
  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  return {
    name: achievement?.nameKey || id,
    description: achievement?.descriptionKey || '',
  };
}
