import styles from './Avatar.module.css';

/**
 * Reusable Avatar component
 * @param {string} name - Full name (for initials fallback)
 * @param {string} src - Image URL (optional)
 * @param {number} size - Pixel size (default: 40)
 * @param {'sm'|'md'|'lg'|'xl'} sizeVariant - Preset size variant
 */
export default function Avatar({ name = '', src, size, sizeVariant = 'md', className = '' }) {
  const initials = name
    ? name
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase()
    : '?';

  const inlineSize = size ? { width: size, height: size, fontSize: size * 0.38 } : undefined;

  return (
    <div
      className={`${styles.avatar} ${styles[sizeVariant]} ${className}`}
      style={inlineSize}
      aria-label={name || 'Avatar'}
    >
      {src ? (
        <img src={src} alt={name} className={styles.img} />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
}
