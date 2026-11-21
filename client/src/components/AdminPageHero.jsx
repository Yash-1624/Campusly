export default function AdminPageHero({ eyebrow, title, description, actions, aside }) {
    return (
        <header className="admin-page-hero">
            <div className="admin-page-hero-copy">
                {eyebrow && <p className="admin-page-hero-eyebrow">{eyebrow}</p>}
                <h1>{title}</h1>
                {description && <p className="admin-page-hero-description">{description}</p>}
            </div>
            {(actions || aside) && <div className="admin-page-hero-actions">{actions || aside}</div>}
        </header>
    );
}
