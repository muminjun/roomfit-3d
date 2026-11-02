export type Millimeters = number;
export type RotationDeg = 0 | 90 | 180 | 270;
export type PointMm = { id: string; x: Millimeters; y: Millimeters };
export type IdGenerator = () => string;
export type FurnitureKind = 'bed' | 'sofa' | 'table' | 'desk' | 'wardrobe' | 'storage' | 'refrigerator' | 'washingMachine' | 'chair' | 'other';
export type Room = { id: string; name: string; polygon: PointMm[]; wallHeightMm: Millimeters; wallThicknessMm: Millimeters };
export type FurnitureItem = { id: string; catalogId: string; kind: FurnitureKind; name: string; position: { x: Millimeters; y: Millimeters }; widthMm: Millimeters; depthMm: Millimeters; heightMm: Millimeters; rotationDeg: RotationDeg; color?: string };
export type ProjectDataV2 = { schemaVersion: 2; id: string; title: string; createdAt: string; updatedAt: string; unit: 'mm'; room: Room; furniture: FurnitureItem[]; settings: { gridSizeMm: 10 | 50 | 100 | 500; snapEnabled: boolean; gridVisible: boolean } };
