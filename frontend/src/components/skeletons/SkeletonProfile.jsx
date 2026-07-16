export default function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-profile__header">
        <div className="skeleton skeleton-profile__avatar" />
        <div className="skeleton-profile__info">
          <div className="skeleton skeleton-profile__name" />
          <div className="skeleton skeleton-profile__meta" />
        </div>
      </div>
      <div className="skeleton-profile__grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-profile__field">
            <div className="skeleton skeleton-profile__label" />
            <div className="skeleton skeleton-profile__value" />
          </div>
        ))}
      </div>
    </div>
  );
}
