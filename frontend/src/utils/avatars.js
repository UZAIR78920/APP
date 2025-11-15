// Predefined avatar URLs (naval/ocean themed)
export const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=ship1&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ship2&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ship3&backgroundColor=06b6d4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ship4&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ship5&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ship6&backgroundColor=ef4444',
];

export const getAvatarUrl = (index) => {
  return AVATARS[index % AVATARS.length];
};
