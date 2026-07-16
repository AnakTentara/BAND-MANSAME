export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-card__thumb" />
      <div className="skeleton skeleton-card__tag" />
      <div className="skeleton skeleton-card__title" />
      <div className="skeleton skeleton-card__title-short" />
      <div className="skeleton skeleton-card__body" />
      <div className="skeleton skeleton-card__body-short" />
      <div className="skeleton-card__footer">
        <div className="skeleton skeleton-card__avatar" />
        <div className="skeleton skeleton-card__meta" />
      </div>
    </div>
  );
}
