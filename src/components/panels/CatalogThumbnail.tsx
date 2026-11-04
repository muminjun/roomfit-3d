import type { CatalogItem } from "../../data/catalog";

/** Small local vector silhouettes, sharing the same category cues as the 3D models. */
export function CatalogThumbnail({ item }: { item: CatalogItem }) {
  const stroke = "currentColor";
  let drawing;
  switch (item.kind) {
    case "bed":
      drawing = <><rect x="8" y="9" width="32" height="32" rx="3" /><path d="M8 20h32M8 34h32M12 41v5m24-5v5" /><rect x="12" y="12" width="10" height="6" rx="2" />{item.widthMm >= 1500 && <rect x="26" y="12" width="10" height="6" rx="2" />}</>;
      break;
    case "sofa":
      drawing = <><rect x="8" y="16" width="32" height="22" rx="5" /><path d="M8 23h6v10h20V23h6M15 38v5m18-5v5M24 17v15" /></>;
      break;
    case "chair":
      drawing = <><rect x="13" y="8" width="22" height="18" rx="4" /><path d="M10 29h28v6H10zM24 35v8m-10 0h20M8 24v8m32-8v8" /></>;
      break;
    case "table":
    case "desk":
      drawing = <><rect x="5" y="17" width="38" height="7" rx="2" /><path d="M10 24v20m28-20v20" />{item.kind === "desk" && <><rect x="19" y="4" width="15" height="10" rx="1" /><path d="M26 14v3m2 9h10v9H28z" /></>}</>;
      break;
    case "washingMachine":
      drawing = <><rect x="10" y="5" width="28" height="39" rx="3" /><path d="M10 14h28m-22-5h6" /><circle cx="24" cy="29" r="10" /><circle cx="32" cy="10" r="1" /></>;
      break;
    case "refrigerator":
      drawing = <><rect x="12" y="3" width="24" height="42" rx="3" /><path d="M12 18h24m-19-10v5m0 11v10" /></>;
      break;
    case "wardrobe":
      drawing = <><rect x="6" y="4" width="36" height="40" rx="2" /><path d="M24 4v40m-5-22v7m10-7v7M10 44v3m28-3v3" /></>;
      break;
    case "storage":
      drawing = <><rect x="7" y="9" width="34" height="33" rx="2" /><path d="M7 20h34M7 31h34" />{item.id === "bookshelf" || item.id === "storage-shelf" ? <path d="M13 9v11m6-11v11m10 0v11m7-11v11m-23 0v11" /> : <path d="M20 15h8m-8 11h8m-8 11h8" />}</>;
      break;
    case "toilet":
      drawing = <><rect x="12" y="4" width="24" height="10" rx="2"/><ellipse cx="24" cy="27" rx="12" ry="15"/><ellipse cx="24" cy="27" rx="7" ry="10"/></>; break;
    case "basin": case "sink":
      drawing = <><rect x="5" y="9" width="38" height="30" rx="4"/><rect x="10" y="15" width="28" height="19" rx="7"/><path d="M20 9V5h8v8"/><circle cx="24" cy="27" r="2"/></>; break;
    case "bathtub":
      drawing = <><rect x="4" y="10" width="40" height="28" rx="7"/><rect x="9" y="15" width="30" height="18" rx="8"/><circle cx="33" cy="24" r="2"/></>; break;
    case "shower":
      drawing = <><rect x="6" y="6" width="36" height="36" rx="3"/><path d="M6 31L31 6M12 37L37 12"/><circle cx="32" cy="32" r="3"/></>; break;
    case "counter": case "hob":
      drawing = <><rect x="5" y="9" width="38" height="30" rx="2"/>{item.kind === "hob" ? <><circle cx="16" cy="19" r="5"/><circle cx="32" cy="29" r="6"/></> : <path d="M5 19h38M16 19v20m16-20v20"/>}</>; break;
    case "dishwasher": case "oven":
      drawing = <><rect x="9" y="5" width="30" height="39" rx="2"/><path d="M9 14h30M15 10h3m5 0h3"/><rect x="14" y="20" width="20" height="16" rx="2"/></>; break;
    case "other":
      drawing = item.id === "column-round" ? <><ellipse cx="24" cy="9" rx="12" ry="5"/><path d="M12 9v30c0 7 24 7 24 0V9"/></> : <><path d="M12 10l16-5 9 5v31l-16 5-9-5zM12 10l9 5 16-5M21 15v31"/></>;
      break;
    default:
      drawing = <><rect x="9" y="10" width="30" height="30" rx="4" /><path d="M9 20h30M19 10v30" /></>;
  }
  return <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-catalog-thumbnail={item.id}>{drawing}</svg>;
}
