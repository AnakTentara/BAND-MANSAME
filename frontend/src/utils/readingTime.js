export const estimateReadingTime = (content) => {
  if (!content) return '1 mnt';
  const wordsPerMinute = 200;
  const cleanText = content.replace(/<\/?[^>]+(>|$)/g, "");
  const wordsCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordsCount / wordsPerMinute);
  return `${minutes} mnt baca`;
};
