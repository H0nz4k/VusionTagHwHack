import { TEMPLATES, type TemplateId } from "../core/templates";

interface Props {
  onPick: (id: TemplateId) => void;
  onCancel: () => void;
}

export function TemplateGallery({ onPick, onCancel }: Props) {
  const groups = [
    { label: "Základ", ids: ["blank"] as TemplateId[] },
    { label: "Testovací", ids: ["bwr-color-test-01-16"] as TemplateId[] },
    { label: "Rozvržení", ids: ["image-captions", "heading-info", "product-price", "three-color-split"] as TemplateId[] },
  ];
  return (
    <div className="modal-backdrop" data-testid="template-gallery">
      <div className="modal gallery-modal">
        <h2>Šablony</h2>
        <p className="muted">Nový projekt ze vestavěné šablony. Vše běží offline.</p>
        {groups.map((g) => (
          <section key={g.label}>
            <h3>{g.label}</h3>
            <div className="template-grid">
              {g.ids.map((id) => {
                const t = TEMPLATES.find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    className="template-card"
                    data-testid={`template-${id}`}
                    onClick={() => onPick(id)}
                  >
                    <strong>{t.name}</strong>
                    <span>{t.description}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        <div className="row">
          <button type="button" onClick={onCancel}>
            Zrušit
          </button>
        </div>
      </div>
    </div>
  );
}
